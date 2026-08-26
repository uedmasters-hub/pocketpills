/**
 * Main-thread driver for on-device handwriting recognition.
 *
 * Lazily spawns the TrOCR worker (mirroring useLocalSpeech's worker lifecycle),
 * downloads the model once, segments the given canvas into line bands, and runs
 * each line through the model, joining the results top-to-bottom.
 *
 * This is deliberately a plain async function rather than a React hook: the OCR
 * pipeline in rxOcr.ts is not React, and calls this as a fallback when the
 * printed-text engine (Tesseract) comes back nearly empty — the signature of a
 * handwritten prescription.
 */
import { segmentLines } from "./lineSegments";

type WorkerOut =
  | { type: "progress"; progress: number }
  | { type: "ready" }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;

/** Cheap capability probe — Workers + canvas 2D are all we need. */
export function handwritingSupported(): boolean {
  return typeof Worker !== "undefined" && typeof document !== "undefined";
}

function spawnWorker(onModelProgress?: (pct: number) => void): Promise<void> {
  if (readyPromise) return readyPromise;

  worker = new Worker(new URL("./trocrWorker.ts", import.meta.url), { type: "module" });

  readyPromise = new Promise<void>((resolve, reject) => {
    const onLoad = (event: MessageEvent<WorkerOut>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        onModelProgress?.(Math.round(msg.progress));
      } else if (msg.type === "ready") {
        worker?.removeEventListener("message", onLoad);
        resolve();
      } else if (msg.type === "error") {
        worker?.removeEventListener("message", onLoad);
        readyPromise = null; // allow retry
        reject(new Error(msg.message));
      }
      // "result" messages belong to a specific recognise request below.
    };
    worker!.addEventListener("message", onLoad);
    worker!.onerror = (event) => {
      readyPromise = null;
      reject(new Error(event.message || "htr-worker-failed"));
    };
    worker!.postMessage({ type: "load" });
  });

  return readyPromise;
}

/** Send one line crop to the worker and resolve with its text. */
function recognizeLine(canvas: HTMLCanvasElement): Promise<string> {
  const active = worker;
  if (!active) return Promise.reject(new Error("htr-worker-unavailable"));
  const cctx = canvas.getContext("2d");
  if (!cctx) return Promise.resolve("");
  const image = cctx.getImageData(0, 0, canvas.width, canvas.height);

  return new Promise<string>((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorkerOut>) => {
      const msg = event.data;
      if (msg.type === "result") {
        active.removeEventListener("message", onMessage);
        resolve(msg.text);
      } else if (msg.type === "error") {
        active.removeEventListener("message", onMessage);
        reject(new Error(msg.message));
      }
    };
    active.addEventListener("message", onMessage);
    // The pixel buffer is transferred, not copied — cheap handoff.
    active.postMessage(
      { type: "recognize", data: image.data, width: image.width, height: image.height },
      [image.data.buffer],
    );
  });
}

export type HtrProgress = (label: string, pct: number) => void;

/**
 * Recognise handwriting on a preprocessed canvas. Returns newline-joined line
 * text. Never throws for empty results — returns "" so the caller can simply
 * compare it against the Tesseract output and keep whichever is richer.
 */
export async function recognizeHandwriting(
  source: HTMLCanvasElement,
  onProgress?: HtrProgress,
): Promise<string> {
  if (!handwritingSupported()) return "";
  try {
    await spawnWorker((pct) => onProgress?.("Loading handwriting reader", pct));
  } catch {
    return "";
  }

  const bands = segmentLines(source);
  const lines: string[] = [];
  for (let i = 0; i < bands.length; i++) {
    onProgress?.("Reading handwriting", Math.round(((i + 1) / bands.length) * 100));
    try {
      const text = await recognizeLine(bands[i].canvas);
      if (text) lines.push(text);
    } catch {
      // One bad line shouldn't sink the whole page.
    }
  }
  return lines.join("\n").trim();
}

/** Free the worker + model memory. Safe to call when the flow closes. */
export function terminateHandwriting() {
  worker?.terminate();
  worker = null;
  readyPromise = null;
}
