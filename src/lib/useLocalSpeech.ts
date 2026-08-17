import { useCallback, useEffect, useRef, useState } from "react";
import { isMicExplicitlyDenied } from "@/lib/micPermission";
import { Recorder, decodeToMono16k } from "@/lib/localWhisper/audio";

export type LocalSpeechLang = "en-US" | "ne-NP";

const LANG_MAP: Record<LocalSpeechLang, "english" | "nepali"> = {
  "en-US": "english",
  "ne-NP": "nepali",
};

/** Safety-net cap on a single recording — well past any search-box query. */
const MAX_RECORDING_MS = 8_000;

type WorkerOutMessage =
  | { type: "progress"; progress: number; loaded: number; total: number }
  | { type: "ready" }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    typeof (window.AudioContext || (window as typeof window & { webkitAudioContext?: unknown }).webkitAudioContext) !== "undefined" &&
    typeof Worker !== "undefined"
  );
}

/**
 * On-device (Whisper via WebAssembly/WebGPU) voice search.
 *
 * Unlike the native-engine hook, this never depends on a browser vendor's own
 * speech backend — audio never leaves the device, so there's nothing for a
 * privacy-focused browser to block. Trade-offs versus the native engine:
 *   - No built-in end-of-speech detection: recording stops when `stop()` is
 *     called (mirrors the mic button's existing tap-to-toggle behaviour) or
 *     after MAX_RECORDING_MS as a safety net — both routes end at the same
 *     `stopAndTranscribe`, so neither path can strand a completed recording
 *     with the mic released but nothing ever transcribing it.
 *   - First use on a given browser downloads a small model (tens of MB,
 *     cached afterwards); `modelState` / `modelProgress` reflect that.
 *   - If the model finishes loading only *after* someone has already started
 *     talking, we don't cut them off — recording continues, and any load
 *     failure is only surfaced once they stop, not mid-sentence.
 *
 * Public shape intentionally matches useBrowserSpeech's
 * { supported, listening, transcript, error, start, stop } (plus additive
 * `transcribing`/`modelState`/`modelProgress`) so the two hooks are
 * interchangeable from the consuming component's point of view.
 */
export function useLocalSpeech(lang: LocalSpeechLang) {
  const supported = isRecordingSupported();

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modelState, setModelState] = useState<"idle" | "loading" | "ready">("idle");
  const [modelProgress, setModelProgress] = useState(0);

  const langRef = useRef(lang);
  langRef.current = lang;

  const workerRef = useRef<Worker | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const maxDurationTimer = useRef<number | null>(null);
  const sessionRef = useRef(false);
  const startingRef = useRef(false);

  /** Lazily create the worker once and kick off model load; safe to call repeatedly. */
  const ensureModelReady = useCallback((): Promise<void> => {
    if (readyPromiseRef.current) return readyPromiseRef.current;

    const worker = new Worker(new URL("./localWhisper/whisperWorker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    setModelState("loading");
    setModelProgress(0);

    readyPromiseRef.current = new Promise<void>((resolve, reject) => {
      const onLoadMessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;
        if (msg.type === "progress") {
          setModelProgress(Math.round(msg.progress));
        } else if (msg.type === "ready") {
          setModelState("ready");
          resolve();
        } else if (msg.type === "error") {
          setModelState("idle");
          readyPromiseRef.current = null; // allow retry on next start()
          reject(new Error(msg.message));
        }
        // "result" messages belong to a specific transcribe request and are
        // handled by that request's own listener, not this load-phase one.
      };
      worker.addEventListener("message", onLoadMessage);
      worker.onerror = (event) => {
        setModelState("idle");
        readyPromiseRef.current = null;
        reject(new Error(event.message || "worker-failed"));
      };
      worker.postMessage({ type: "load" });
    });

    return readyPromiseRef.current;
  }, []);

  /** Send one clip to the worker and resolve with its transcript. */
  const transcribeClip = useCallback(async (audio: Float32Array): Promise<string> => {
    await ensureModelReady();
    const worker = workerRef.current;
    if (!worker) throw new Error("worker-unavailable");

    return new Promise<string>((resolve, reject) => {
      const onMessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;
        if (msg.type === "result") {
          worker.removeEventListener("message", onMessage);
          resolve(msg.text);
        } else if (msg.type === "error") {
          worker.removeEventListener("message", onMessage);
          reject(new Error(msg.message));
        }
      };
      worker.addEventListener("message", onMessage);
      // Float32Array's buffer is transferred, not copied — cheap handoff.
      worker.postMessage(
        { type: "transcribe", audio, language: LANG_MAP[langRef.current] },
        [audio.buffer],
      );
    });
  }, [ensureModelReady]);

  /**
   * The single "recording finished" path. Every way a recording can end —
   * a manual tap on the mic, or the safety-net timer — calls this, so
   * `listening` and the transcription request always happen together.
   */
  const stopAndTranscribe = useCallback(() => {
    if (maxDurationTimer.current) {
      window.clearTimeout(maxDurationTimer.current);
      maxDurationTimer.current = null;
    }
    sessionRef.current = false;
    startingRef.current = false;
    setListening(false);
    setError(null);

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;

    void (async () => {
      setTranscribing(true);
      try {
        const blob = await recorder.stop();
        const audio = await decodeToMono16k(blob);
        const text = await transcribeClip(audio);
        setTranscript(text);
        if (!text) setError("no-speech");
      } catch (err) {
        setError(err instanceof Error && err.message === "worker-unavailable" ? "model-load-failed" : "transcribe-failed");
      } finally {
        setTranscribing(false);
      }
    })();
  }, [transcribeClip]);

  const start = useCallback(async () => {
    if (!supported) {
      setError("unsupported");
      return;
    }
    if (startingRef.current || sessionRef.current) return;

    startingRef.current = true;
    setError(null);
    setTranscript("");

    if (await isMicExplicitlyDenied()) {
      startingRef.current = false;
      setError("not-allowed");
      return;
    }

    // Kick off model load and the mic prompt together rather than one after
    // the other — on a first-ever use the download can take a few seconds,
    // and there's no reason the mic permission prompt should wait behind it.
    void ensureModelReady().catch(() => {
      /* surfaced when recording ends, via stopAndTranscribe — not here,
         since the user may still be mid-sentence when a load fails. */
    });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      startingRef.current = false;
      const name = err instanceof DOMException ? err.name : "";
      setError(name === "NotAllowedError" || name === "PermissionDeniedError" ? "not-allowed" : "audio-capture");
      return;
    }

    sessionRef.current = true;
    startingRef.current = false;
    setListening(true);
    recorderRef.current = new Recorder(stream);
    maxDurationTimer.current = window.setTimeout(stopAndTranscribe, MAX_RECORDING_MS);
  }, [ensureModelReady, stopAndTranscribe, supported]);

  useEffect(() => {
    return () => {
      sessionRef.current = false;
      startingRef.current = false;
      if (maxDurationTimer.current) window.clearTimeout(maxDurationTimer.current);
      recorderRef.current?.stop().catch(() => {});
      workerRef.current?.terminate();
      workerRef.current = null;
      readyPromiseRef.current = null;
    };
  }, []);

  return {
    supported,
    listening,
    transcribing,
    transcript,
    error,
    modelState,
    modelProgress,
    start,
    stop: stopAndTranscribe,
  };
}

