import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PAGE_SEARCH_COPY, type PageSearchScope } from "@/lib/pageSearch";
import {
  voiceLangFromSiteLang,
  type VoiceSearchLang,
} from "@/lib/specialtySearch";
import { useBrowserSpeech } from "@/lib/useBrowserSpeech";

type Props = {
  /** Limits search UX copy + voice to this page’s domain. */
  scope: PageSearchScope;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Optional override for placeholder (still stays page-local). */
  placeholder?: string;
  pill?: boolean;
};

function voiceErrorMessage(
  error: string | null,
  tx: (s: string) => string,
): string | null {
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
    case "service-not-allowed":
      return tx("Voice search is blocked in this browser. Try Chrome.");
    case "busy":
      return tx("Mic is busy. Wait a moment, then try again.");
    case "no-speech":
      return tx("Didn’t catch that — tap the mic and try again.");
    case "language-not-supported":
      return tx("That voice language isn’t supported here. Try EN.");
    default:
      return tx("Couldn’t start listening. Tap the mic again.");
  }
}

/**
 * Shared search field used across pages.
 * Results stay page-scoped via `scope` + each page’s own filter helper.
 * Universal / FAQ search is intentionally not mixed in here.
 */
export function PageSearchField({
  scope,
  value,
  onChange,
  className = "",
  placeholder: placeholderOverride,
  pill = false,
}: Props) {
  const { tx, lang } = useI18n();
  const inputId = useId();
  const copy = PAGE_SEARCH_COPY[scope];
  const [voiceLang, setVoiceLang] = useState<VoiceSearchLang>(() =>
    voiceLangFromSiteLang(lang),
  );
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const restartTimer = useRef<number | null>(null);

  const { supported, listening, transcript, error, start, stop } =
    useBrowserSpeech(voiceLang);

  useEffect(() => {
    setVoiceLang(voiceLangFromSiteLang(lang));
  }, [lang]);

  useEffect(() => {
    if (!transcript) return;
    onChangeRef.current(transcript);
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (restartTimer.current) window.clearTimeout(restartTimer.current);
    };
  }, []);

  const placeholder = tx(placeholderOverride || copy.placeholder);
  const ariaLabel = tx(copy.ariaLabel);
  const voiceError = voiceErrorMessage(error, tx);

  const toggleVoice = () => {
    if (!supported) return;
    if (listening) {
      stop();
      return;
    }
    void start();
  };

  const switchVoiceLang = (next: VoiceSearchLang) => {
    if (restartTimer.current) window.clearTimeout(restartTimer.current);
    const wasListening = listening;
    if (wasListening) stop();
    setVoiceLang(next);
    if (wasListening) {
      restartTimer.current = window.setTimeout(() => {
        void start();
      }, 450);
    }
  };

  return (
    <div className={className}>
      <label className="relative block" htmlFor={inputId}>
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary"
          aria-hidden
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l4 4" strokeLinecap="round" />
          </svg>
        </span>

        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          data-search-scope={scope}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className={
            "h-12 w-full border border-line bg-white pl-11 pr-[7.75rem] text-base text-ink " +
            (pill ? "rounded-full " : "rounded-2xl ") +
            "placeholder:text-ink-tertiary focus:border-primary " +
            (listening ? "border-[color:var(--pp-violet)] shadow-[0_0_0_3px_rgba(107,77,230,0.12)]" : "")
          }
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <div
            className="flex shrink-0 overflow-hidden rounded-full border border-line bg-[color:var(--pp-primary-100)] p-0.5"
            role="group"
            aria-label={tx("Voice language")}
          >
            {(
              [
                { id: "en-US" as const, label: "EN" },
                { id: "ne-NP" as const, label: "ने" },
              ] as const
            ).map((opt) => {
              const on = voiceLang === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => switchVoiceLang(opt.id)}
                  className={
                    "rounded-full px-2 py-1 text-[11px] font-semibold transition-colors " +
                    (on
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "text-[color:var(--pp-primary-950)] hover:bg-white/70")
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
              "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors " +
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
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21a1 1 0 1 0 2 0v-3.07A7 7 0 0 0 19 11Z" />
              </svg>
            )}
          </button>
        </div>
      </label>

      {(listening || voiceError) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-tertiary">
          {listening && (
            <p className="font-medium text-[color:var(--pp-violet)]">
              {tx(voiceLang === "ne-NP" ? copy.listeningNe : copy.listeningEn)}
            </p>
          )}
          {voiceError && !listening && (
            <p className="text-[#D97757]" role="alert">
              {voiceError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** @deprecated Prefer PageSearchField with an explicit scope. */
export function CareSearchField(
  props: Omit<Props, "scope"> & { specialtyMode?: boolean },
) {
  const { specialtyMode = true, ...rest } = props;
  return (
    <PageSearchField
      {...rest}
      scope={specialtyMode ? "appointments" : "appointments-providers"}
    />
  );
}

