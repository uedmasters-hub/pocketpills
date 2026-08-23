import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { voiceLangFromSiteLang, type VoiceSearchLang } from "@/lib/specialtySearch";
import { useLocalSpeech } from "@/lib/useLocalSpeech";
import {
  SearchDoctorIcon,
  SearchLocationIcon,
  SearchMagnifyIcon,
  SearchMicIcon,
} from "@/components/landing/SearchIcons";

type Suggestion = {
  id: string;
  label: string;
  hint: string;
  to: string;
  icon: "doctor" | "location" | "search";
};

const QUICK_SUGGESTIONS: Suggestion[] = [
  {
    id: "doctors",
    label: "Doctors",
    hint: "Find verified physicians",
    to: "/doctors",
    icon: "doctor",
  },
  {
    id: "hospitals",
    label: "Hospitals & clinics",
    hint: "Browse facilities nearby",
    to: "/facilities",
    icon: "location",
  },
  {
    id: "ambulance",
    label: "Ambulance & emergency",
    hint: "Urgent care services",
    to: "/appointments",
    icon: "search",
  },
  {
    id: "labs",
    label: "Labs & pathology",
    hint: "Book tests and diagnostics",
    to: "/appointments",
    icon: "search",
  },
  {
    id: "home-care",
    label: "Home care & nurses",
    hint: "In-home assistance",
    to: "/appointments",
    icon: "doctor",
  },
];

function voiceErrorMessage(error: string | null, tx: (s: string) => string): string | null {
  if (!error) return null;
  switch (error) {
    case "unsupported":
      return tx("Voice search needs Chrome or Edge.");
    case "not-allowed":
      return tx("Allow microphone access for this site, then tap the mic again.");
    case "audio-capture":
      return tx("No microphone found. Check your input device.");
    case "network":
      return tx("Voice search needs an internet connection.");
    case "network-brave":
      return tx(
        "Voice search doesn’t work in Brave — Shields blocks it by design. Try Chrome or Edge, or turn Shields off for this site.",
      );
    case "service-not-allowed":
      return tx("Voice search is blocked in this browser. Try Chrome.");
    case "busy":
      return tx("Mic is busy. Wait a moment, then try again.");
    case "no-speech":
      return tx("Didn’t catch that — tap the mic and try again.");
    case "model-load-failed":
      return tx("Couldn’t load the voice model. Check your connection and try again.");
    case "transcribe-failed":
      return tx("Couldn’t transcribe that. Try again.");
    case "language-not-supported":
      return tx("That voice language isn’t supported here. Try EN.");
    default:
      return tx("Couldn’t start listening. Tap the mic again.");
  }
}

function SuggestionIcon({ kind }: { kind: Suggestion["icon"] }) {
  const cls = "h-4 w-4 shrink-0 text-[color:var(--pp-primary-950)]";
  if (kind === "doctor") return <SearchDoctorIcon className={cls} />;
  if (kind === "location") return <SearchLocationIcon className={cls} />;
  return <SearchMagnifyIcon className={cls} />;
}

/**
 * Landing search pill — design match for draft homepage.
 * Language toggle updates site locale; mic uses local speech; Search navigates.
 */
export function LandingSearchWidget() {
  const { tx, lang, setLang } = useI18n();
  const nav = useNavigate();
  const inputId = useId();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [voiceLang, setVoiceLang] = useState<VoiceSearchLang>(() => voiceLangFromSiteLang(lang));
  const restartTimer = useRef<number | null>(null);

  const { supported, listening, transcribing, transcript, error, modelState, modelProgress, start, stop } =
    useLocalSpeech(voiceLang);

  useEffect(() => {
    setVoiceLang(voiceLangFromSiteLang(lang));
  }, [lang]);

  useEffect(() => {
    if (!transcript) return;
    setQuery(transcript);
    setOpen(true);
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (restartTimer.current) window.clearTimeout(restartTimer.current);
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_SUGGESTIONS;
    return QUICK_SUGGESTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.hint.toLowerCase().includes(q) ||
        s.id.includes(q),
    );
  }, [query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  /* When suggestions open, scroll the field up so the list isn’t clipped by the fold. */
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const el = wrapRef.current;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const voiceError = voiceErrorMessage(error, tx);

  const goSearch = (override?: string) => {
    const q = (override ?? query).trim();
    if (!q) {
      nav("/appointments");
      return;
    }
    const hit = filtered.find((s) => s.label.toLowerCase() === q.toLowerCase());
    if (hit) {
      nav(hit.to);
      return;
    }
    nav(`/appointments?q=${encodeURIComponent(q)}`);
  };

  const pickSuggestion = (s: Suggestion) => {
    setQuery(s.label);
    setOpen(false);
    if (s.to.startsWith("/appointments")) {
      nav(`/appointments?q=${encodeURIComponent(s.label)}`);
      return;
    }
    nav(s.to);
  };

  const toggleVoice = () => {
    if (!supported) return;
    if (listening) {
      stop();
      return;
    }
    void start();
  };

  const switchSiteLang = (code: "en" | "ne") => {
    setLang(code);
    const nextVoice = voiceLangFromSiteLang(code);
    if (restartTimer.current) window.clearTimeout(restartTimer.current);
    const wasListening = listening;
    if (wasListening) stop();
    setVoiceLang(nextVoice);
    if (wasListening) {
      restartTimer.current = window.setTimeout(() => {
        void start();
      }, 450);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={
        "relative mx-auto w-full max-w-[75rem] " + (open ? "z-40" : "z-10")
      }
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          goSearch();
        }}
        className={
          "flex items-center gap-2 rounded-full border bg-white py-1.5 pl-4 pr-1.5 shadow-[0_8px_30px_rgba(24,7,48,0.06)] transition-[border-color,box-shadow] " +
          (listening
            ? "border-[color:var(--pp-violet)] shadow-[0_0_0_3px_rgba(107,77,230,0.12)]"
            : "border-line")
        }
      >
        <span className="shrink-0 text-ink-tertiary" aria-hidden>
          <SearchMagnifyIcon className="h-5 w-5" />
        </span>

        <input
          id={inputId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              setOpen(true);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Enter" && open && filtered[activeIdx]) {
              e.preventDefault();
              pickSuggestion(filtered[activeIdx]);
            }
          }}
          placeholder={tx("Search doctors, hospitals, clinics, ambulances, home care, labs...")}
          aria-label={tx("Search healthcare services")}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary"
        />

        <div
          className="flex shrink-0 overflow-hidden rounded-full bg-[color:var(--pp-primary-100)] p-0.5"
          role="group"
          aria-label={tx("Language")}
        >
          {(
            [
              { id: "en" as const, label: "EN" },
              { id: "ne" as const, label: "ने" },
            ] as const
          ).map((opt) => {
            const on = lang === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => switchSiteLang(opt.id)}
                className={
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors " +
                  (on
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "text-[color:var(--pp-primary-950)] hover:bg-white/80")
                }
                aria-pressed={on}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleVoice}
          disabled={!supported}
          title={
            listening
              ? tx("Stop listening")
              : voiceLang === "ne-NP"
                ? tx("Speak in Nepali")
                : tx("Speak in English")
          }
          aria-label={listening ? tx("Stop voice search") : tx("Start voice search")}
          aria-pressed={listening}
          className={
            "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors " +
            (listening
              ? "bg-[color:var(--pp-violet)] text-white"
              : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-100)]") +
            (!supported ? " cursor-not-allowed opacity-40" : "")
          }
        >
          {listening ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <SearchMicIcon className="h-5 w-5" />
          )}
        </button>

        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[color:var(--pp-primary-950)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80 sm:px-5"
        >
          <SearchMagnifyIcon className="h-4 w-4 text-white" />
          <span className="hidden sm:inline">{tx("Search")}</span>
        </button>
      </form>

      {(listening || transcribing || (modelState === "loading" && !listening) || voiceError) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-ink-tertiary">
          {modelState === "loading" && !listening && (
            <p className="font-medium text-[color:var(--pp-violet)]">
              {tx("Loading voice model…")} {modelProgress > 0 ? `${modelProgress}%` : ""}
            </p>
          )}
          {listening && (
            <p className="font-medium text-[color:var(--pp-violet)]">
              {tx(voiceLang === "ne-NP" ? "Listening in Nepali… speak, then pause" : "Listening in English… speak, then pause")}
            </p>
          )}
          {transcribing && !listening && (
            <p className="font-medium text-[color:var(--pp-violet)]">{tx("Transcribing…")}</p>
          )}
          {voiceError && !listening && !transcribing && (
            <p className="text-[#D97757]" role="alert">
              {voiceError}
            </p>
          )}
        </div>
      )}

      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={tx("Search suggestions")}
          className="absolute left-0 right-0 z-50 mt-2 max-h-[min(22rem,50vh)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white py-1 shadow-float"
        >
          {filtered.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => pickSuggestion(s)}
                className={
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors " +
                  (i === activeIdx ? "bg-[color:var(--state-hover)]" : "hover:bg-[color:var(--state-hover)]")
                }
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--pp-primary-100)]">
                  <SuggestionIcon kind={s.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {tx(s.label)}
                  </span>
                  <span className="block truncate text-xs text-ink-tertiary">{tx(s.hint)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
