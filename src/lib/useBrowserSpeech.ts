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

async function primeMicrophone(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // Release immediately — SpeechRecognition opens its own capture stream.
  stream.getTracks().forEach((t) => t.stop());
}

/**
 * Web Speech API wrapper for EN / Nepali voice search.
 * - Primes mic permission via getUserMedia first
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

    try {
      // Warm mic permission first so SpeechRecognition doesn’t fail opaquely.
      await primeMicrophone();
    } catch (err) {
      startingRef.current = false;
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "not-allowed"
          : "audio-capture",
      );
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
      if (code === "aborted" || code === "no-speech") {
        sessionRef.current = false;
        startingRef.current = false;
        setListening(false);
        return;
      }
      sessionRef.current = false;
      startingRef.current = false;
      setListening(false);
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
