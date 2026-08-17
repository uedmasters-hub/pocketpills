import { useCallback, useEffect, useRef, useState } from "react";

export type BrowserSpeechLang = "en-US" | "ne-NP";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Read-only permission check — never opens the microphone.
 *
 * The previous approach called getUserMedia() and immediately stopped the
 * tracks to "warm up" the permission before handing off to SpeechRecognition.
 * That open-then-instantly-close cycle races the capture device: the OS/driver
 * hasn't finished tearing down the first stream when SpeechRecognition opens
 * its own, so its first audio buffer window comes back empty and Chrome's
 * silence detector fires `no-speech` within a few hundred ms — indistinguishable
 * from the mic switching itself off right after it switched on. The fix is to
 * never touch the hardware before `rec.start()`: SpeechRecognition manages its
 * own capture and permission prompt, so there's nothing to prime.
 *
 * The Permissions API query below is informational only — it reads recorded
 * state without opening a stream, so it can't cause this race. It's used
 * purely to fail fast with a friendly message when permission is already
 * denied, skipping the recognition attempt entirely.
 */
async function isMicExplicitlyDenied(): Promise<boolean> {
  try {
    if (!navigator.permissions?.query) return false;
    // Not all browsers support "microphone" as a query name (notably Firefox);
    // an unsupported name throws, which the catch below treats as "unknown".
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state === "denied";
  } catch {
    return false;
  }
}

/**
 * Brave ships Chrome's SpeechRecognition surface (so `supported` is true and
 * the UI shows the mic), but Brave doesn't proxy the closed, Google-hosted
 * speech backend that engine depends on — Shields blocks the call by design,
 * as part of not routing traffic through Google's infrastructure. The result
 * is an instant `network` error on every attempt, regardless of whether the
 * machine actually has internet access, and there's no client-side retry that
 * fixes it — only a different browser or Shields being turned off for the
 * site. `navigator.brave.isBrave()` is Brave's own (unofficial but standard)
 * self-identification hook; feature-detected so it's a no-op everywhere else.
 */
async function isBraveBrowser(): Promise<boolean> {
  try {
    const brave = (navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave;
    if (typeof brave?.isBrave !== "function") return false;
    return await brave.isBrave();
  } catch {
    return false;
  }
}

/**
 * Web Speech API wrapper for EN / Nepali voice search.
 * - Never opens its own getUserMedia stream — avoids racing SpeechRecognition's
 *   internal capture, which was causing near-instant `no-speech` shutoffs.
 * - Never auto-restarts (avoids mic flip)
 * - Waits for prior sessions to finish before starting again
 */
export function useBrowserSpeech(lang: BrowserSpeechLang) {
  const Ctor = getSpeechRecognitionCtor();
  const supported = !!Ctor;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const sessionRef = useRef(false);
  const startingRef = useRef(false);
  const endedWaiters = useRef<Array<() => void>>([]);

  const notifyEnded = useCallback(() => {
    const waiters = endedWaiters.current;
    endedWaiters.current = [];
    waiters.forEach((w) => w());
  }, []);

  const waitUntilIdle = useCallback(async () => {
    if (!recognitionRef.current) return;
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 900);
      endedWaiters.current.push(() => {
        window.clearTimeout(timeout);
        resolve();
      });
    });
  }, []);

  const hardStop = useCallback(() => {
    sessionRef.current = false;
    startingRef.current = false;
    const rec = recognitionRef.current;
    if (!rec) {
      setListening(false);
      notifyEnded();
      return;
    }

    rec.onresult = null;
    rec.onerror = null;
    rec.onstart = null;
    rec.onend = () => {
      if (recognitionRef.current === rec) recognitionRef.current = null;
      setListening(false);
      notifyEnded();
    };

    try {
      rec.stop();
    } catch {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      if (recognitionRef.current === rec) recognitionRef.current = null;
      setListening(false);
      notifyEnded();
    }
  }, [notifyEnded]);

  const stop = useCallback(() => {
    setError(null);
    hardStop();
  }, [hardStop]);

  const start = useCallback(async () => {
    if (!Ctor) {
      setError("unsupported");
      return;
    }
    if (startingRef.current) return;

    startingRef.current = true;
    setError(null);
    setTranscript("");

    if (await isMicExplicitlyDenied()) {
      startingRef.current = false;
      setError("not-allowed");
      setListening(false);
      return;
    }

    if (recognitionRef.current) {
      hardStop();
      await waitUntilIdle();
      await new Promise((r) => setTimeout(r, 150));
    }

    const rec = new Ctor();
    rec.lang = langRef.current;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (!sessionRef.current) return;
      startingRef.current = false;
      setListening(true);
      setError(null);
    };

    rec.onresult = (event) => {
      if (!sessionRef.current) return;
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0]?.transcript || "";
      }
      setTranscript(text.trim());
    };

    rec.onerror = (event) => {
      const code = event.error || "error";
      sessionRef.current = false;
      startingRef.current = false;
      setListening(false);
      // "aborted" is our own hardStop()/restart flow — silent by design.
      // "no-speech" now surfaces a soft message instead of vanishing silently:
      // with the mic-priming race removed, a real no-speech means the user
      // genuinely didn't say anything in time, and they should know that's
      // why listening stopped rather than wonder if it broke.
      if (code === "aborted") return;
      if (code === "network") {
        // Distinguish "Brave blocked this" (no client-side fix) from a real
        // connectivity problem (worth telling the user to check their network).
        void isBraveBrowser().then((brave) => setError(brave ? "network-brave" : "network"));
        return;
      }
      setError(code);
    };

    rec.onend = () => {
      sessionRef.current = false;
      startingRef.current = false;
      setListening(false);
      if (recognitionRef.current === rec) recognitionRef.current = null;
      notifyEnded();
    };

    recognitionRef.current = rec;
    sessionRef.current = true;

    try {
      rec.start();
    } catch (err) {
      sessionRef.current = false;
      startingRef.current = false;
      if (recognitionRef.current === rec) recognitionRef.current = null;
      setListening(false);
      const msg = err instanceof Error ? err.message : "";
      setError(msg.toLowerCase().includes("already started") ? "busy" : "start-failed");
      notifyEnded();
    }
  }, [Ctor, hardStop, notifyEnded, waitUntilIdle]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(
    () => () => {
      sessionRef.current = false;
      startingRef.current = false;
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onstart = null;
        rec.onend = null;
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
      }
    },
    [],
  );

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
  };
}


