import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANG_META,
  loadLanguage,
  saveLanguage,
  type LangCode,
} from "@/lib/accountPrefs";
import { translate, type MessageKey } from "@/lib/i18n/messages";
import { translatePhrase } from "@/lib/i18n/phrases";

type I18nValue = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  /** Keyed catalog (chrome / stable keys). */
  t: (key: MessageKey) => string;
  /** English-source phrase lookup for page body copy. */
  tx: (english: string) => string;
  short: string;
  meta: (typeof LANG_META)[LangCode];
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => loadLanguage());

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    saveLanguage(code);
  }, []);

  useEffect(() => {
    saveLanguage(lang);
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const t = (key: MessageKey) => translate(lang, key);
    const tx = (english: string) => translatePhrase(lang, english);
    return {
      lang,
      setLang,
      t,
      tx,
      short: LANG_META[lang].short,
      meta: LANG_META[lang],
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Safe for optional use outside provider (falls back to English). */
export function useT() {
  const ctx = useContext(I18nContext);
  return useCallback(
    (key: MessageKey) => (ctx ? ctx.t(key) : translate("en", key)),
    [ctx],
  );
}

export function useTx() {
  const ctx = useContext(I18nContext);
  return useCallback(
    (english: string) => (ctx ? ctx.tx(english) : english),
    [ctx],
  );
}

/** Inline translated English phrase: <T>Get started</T> */
export function T({ children }: { children: string }) {
  const { tx } = useI18n();
  return <>{tx(children)}</>;
}
