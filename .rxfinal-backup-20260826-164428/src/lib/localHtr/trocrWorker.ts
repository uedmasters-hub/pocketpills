/**
 * Runs Microsoft's TrOCR handwriting model entirely inside a Web Worker,
 * mirroring localWhisper/whisperWorker.ts so the two heavy on-device models
 * behave and fail the same way.
 *
 * Same two reasons it lives off the main thread:
 * 1. Model download (tens of MB, cached after first use) and inference both
 *    take real time; either on the main thread would freeze the page.
 * 2. It keeps @huggingface/transformers + the ONNX runtime out of the main
 *    bundle's critical path — pulled in only once someone actually asks to
 *    read a handwritten prescription.
 *
 * TrOCR is single-line: each message carries ONE already-segmented line crop
 * (see lineSegments.ts). The crop arrives as raw RGBA so the worker never
 * needs DOM image decoding — it wraps the pixels in a RawImage directly.
 *
 * Message protocol (all messages are `{ type, ... }` objects):
 *   in  { type: "load" }
 *   out { type: "progress", progress }                 (0..100, repeated)
 *   out { type: "ready" }
 *   in  { type: "recognize", data: Uint8ClampedArray, width, height }
 *   out { type: "result", text }
 *   out { type: "error", message }
 *
 * `self` is typed loosely here for the same reason as the Whisper worker: the
 * `webworker` TS lib conflicts with the app's `DOM` lib. Scoping the cast to
 * this file avoids touching tsconfig for the whole project.
 */
import { pipeline, RawImage, type ImageToTextPipeline } from "@huggingface/transformers";

const ctx = self as unknown as {
  postMessage: (msg: unknown) => void;
  onmessage: ((event: MessageEvent) => void) | null;
};

// "small" over "base": ~4x smaller download and fast enough on WASM, at a
// modest accuracy cost. Both are IAM-trained English handwriting models.
const MODEL_ID = "Xenova/trocr-small-handwritten";
const DTYPE = "q8" as const;

let readerPromise: Promise<ImageToTextPipeline> | null = null;

function loadModel(): Promise<ImageToTextPipeline> {
  if (readerPromise) return readerPromise;

  readerPromise = pipeline("image-to-text", MODEL_ID, {
    // "auto" picks WebGPU where available and falls back to WASM itself.
    device: "auto",
    dtype: DTYPE,
    progress_callback: (info) => {
      if (info.status === "progress" && typeof info.progress === "number") {
        ctx.postMessage({ type: "progress", progress: info.progress });
      }
    },
  }) as Promise<ImageToTextPipeline>;

  return readerPromise;
}

ctx.onmessage = async (event: MessageEvent) => {
  const data = event.data as
    | { type: "load" }
    | { type: "recognize"; data: Uint8ClampedArray; width: number; height: number };

  if (data.type === "load") {
    try {
      await loadModel();
      ctx.postMessage({ type: "ready" });
    } catch (err) {
      readerPromise = null; // allow retry on next load
      ctx.postMessage({ type: "error", message: describeError(err) });
    }
    return;
  }

  if (data.type === "recognize") {
    try {
      const reader = await loadModel();
      // RGBA line crop -> RawImage (4 channels); the processor resizes/normalises.
      const image = new RawImage(data.data, data.width, data.height, 4);
      const output = await reader(image);
      const text = Array.isArray(output)
        ? output[0]?.generated_text ?? ""
        : (output as { generated_text?: string }).generated_text ?? "";
      ctx.postMessage({ type: "result", text: String(text).trim() });
    } catch (err) {
      ctx.postMessage({ type: "error", message: describeError(err) });
    }
  }
};

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
