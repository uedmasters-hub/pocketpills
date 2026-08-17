/**
 * Mic capture + resampling for the on-device transcriber.
 *
 * Whisper's feature extractor expects mono PCM at 16kHz. A raw Float32Array
 * carries no sample-rate metadata, so unlike passing a URL to the pipeline
 * (which transformers.js decodes and resamples itself), supplying our own
 * array makes us responsible for getting the format right first.
 */

const TARGET_SAMPLE_RATE = 16_000;

export class Recorder {
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private stream: MediaStream;
  private resolveStop: ((blob: Blob) => void) | null = null;

  /**
   * Records until `.stop()` is called — no internal timer. A max-duration
   * safety net belongs one layer up (in the hook), so that whatever triggers
   * it — a manual tap or the timer — goes through the exact same "stop,
   * decode, transcribe" path, rather than the timer having its own separate,
   * easy-to-forget cleanup.
   */
  constructor(stream: MediaStream) {
    this.stream = stream;
    // Let the browser pick a supported mimeType rather than forcing one —
    // codec support varies (Safari, in particular, is picky here).
    this.recorder = new MediaRecorder(stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.recorder.mimeType || "audio/webm" });
      this.resolveStop?.(blob);
      this.resolveStop = null;
    };
    this.recorder.start();
  }

  /** Stop recording and release the microphone. Resolves with the clip. */
  stop(): Promise<Blob> {
    const done = new Promise<Blob>((resolve) => {
      this.resolveStop = resolve;
    });
    if (this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
    this.stream.getTracks().forEach((t) => t.stop());
    return done;
  }
}

/** Decode a recorded clip and resample it to mono 16kHz for Whisper. */
export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();

  // A throwaway context just to decode the container (webm/ogg/mp4 — whatever
  // the browser recorded) into raw PCM at its native rate.
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) throw new Error("audio-decode-unsupported");
  const decodeCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void decodeCtx.close();
  }

  // OfflineAudioContext resamples + mixes to mono in one pass by rendering
  // at the target rate — the standard, correct way to resample in-browser.
  const durationS = decoded.duration;
  const offline = new OfflineAudioContext(1, Math.ceil(durationS * TARGET_SAMPLE_RATE), TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

