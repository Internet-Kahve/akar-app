"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localize, translate, type Lang, type MessageVars } from "../lib/i18n";
import type { MessageKey } from "../lib/messages";

export interface I18n {
  lang: Lang;
  /** UI string in the site language. */
  t: (key: MessageKey, vars?: MessageVars) => string;
  /** Content text in the site language, falling back to Turkish (plain string, e.g. for attributes). */
  text: (tr: string, en: string | null | undefined) => string;
}

const LangContext = createContext<Lang>("tr");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useI18n(): I18n {
  const lang = useContext(LangContext);
  return useMemo(
    () => ({
      lang,
      t: (key, vars) => translate(lang, key, vars),
      text: (tr, en) => localize(lang, tr, en).text,
    }),
    [lang],
  );
}

/** Content text in the site language; a Turkish fallback in the English site is marked `lang="tr"` with a small tag. */
export function Localized({ tr, en }: { tr: string; en: string | null | undefined }) {
  const lang = useContext(LangContext);
  const { text, fallback } = localize(lang, tr, en);
  if (!fallback) return <>{text}</>;
  return (
    <>
      <span lang="tr">{text}</span>{" "}
      <span className="lang-fallback">{translate(lang, "common.turkishTag")}</span>
    </>
  );
}
