/**
 * Runs Whisper entirely inside a Web Worker.
 *
 * Two reasons this lives off the main thread:
 * 1. Model download (~40-70MB, cached after first use) and inference both take
 *    real time; doing either on the main thread would freeze the page's UI.
 * 2. It keeps the heavy dependency (@huggingface/transformers + ONNX runtime)
 *    out of the main bundle's critical path — it's only pulled in once someone
 *    actually taps the mic.
 *
 * Message protocol (all messages are `{ type, ... }` objects):
 *   in  { type: "load" }
 *   out { type: "progress", progress, loaded, total }   (0..100, repeated)
 *   out { type: "ready" }
 *   in  { type: "transcribe", audio: Float32Array, language: "english"|"nepali" }
 *   out { type: "result", text }
 *   out { type: "error", message }
 *
 * `self` is typed loosely here rather than pulling in the `webworker` TS lib,
 * which conflicts with the app's `DOM` lib (both declare an incompatible
 * global `self`). Scoping the cast to this one file avoids that fight without
 * touching tsconfig for the whole project.
 */
import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

const ctx = self as unknown as {
  postMessage: (msg: unknown) => void;
  onmessage: ((event: MessageEvent) => void) | null;
};

type WorkerLanguage = "english" | "nepali";

// Multilingual tiny model — NOT the ".en" variant, since Nepali needs multi-
// language coverage. q8 (8-bit) quantization keeps the download small.
const MODEL_ID = "Xenova/whisper-tiny";
const DTYPE = "q8" as const;

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function loadModel(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriberPromise) return transcriberPromise;

  transcriberPromise = pipeline("automatic-speech-recognition", MODEL_ID, {
    // "auto" picks WebGPU where available and falls back to WASM itself —
    // no need to hand-roll that fallback.
    device: "auto",
    dtype: DTYPE,
    progress_callback: (info) => {
      if (info.status === "progress_total") {
        ctx.postMessage({
          type: "progress",
          progress: info.progress,
          loaded: info.loaded,
          total: info.total,
        });
      }
    },
  }) as Promise<AutomaticSpeechRecognitionPipeline>;

  return transcriberPromise;
}

ctx.onmessage = async (event: MessageEvent) => {
  const data = event.data as
    | { type: "load" }
    | { type: "transcribe"; audio: Float32Array; language: WorkerLanguage };

  if (data.type === "load") {
    try {
      await loadModel();
      ctx.postMessage({ type: "ready" });
    } catch (err) {
      transcriberPromise = null; // allow retry on next start()
      ctx.postMessage({ type: "error", message: describeError(err) });
    }
    return;
  }

  if (data.type === "transcribe") {
    try {
      const transcriber = await loadModel();
      const output = await transcriber(data.audio, {
        language: data.language,
        task: "transcribe",
      });
      const text = Array.isArray(output) ? output[0]?.text ?? "" : output.text;
      ctx.postMessage({ type: "result", text: text.trim() });
    } catch (err) {
      ctx.postMessage({ type: "error", message: describeError(err) });
    }
  }
};

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

