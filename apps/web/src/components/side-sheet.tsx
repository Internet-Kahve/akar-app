"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronRight, X } from "lucide-react";
import type { HeritageSite, Trust } from "@akar/domain";
import { Localized, useI18n } from "./i18n";

const trustTones: Record<Trust, string> = {
  verified: "success",
  inferred: "warning",
  representative: "representative",
};
const TRUSTS = Object.keys(trustTones) as Trust[];
const QUOTE_MAX = 220;

/** What «Bu bilgi nereden geliyor?» shows. */
export interface SourceDetail {
  trust: Trust;
  quote?: string;
  /** Book and page lines. */
  sources?: Array<{ title: string; detail?: string }>;
}
const SheetContext = createContext<(detail: SourceDetail) => void>(() => {});

function shorten(text: string) {
  if (text.length <= QUOTE_MAX) return text;
  return `${text.slice(0, QUOTE_MAX - 3).replace(/\s+\S*$/, "")}…`;
}

/** A trust tag; tapping it tells where the statement comes from. */
export function TrustTag({
  trust,
  quote,
  sources,
}: SourceDetail) {
  const open = useContext(SheetContext);
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`tag trust-tag ${trustTones[trust]}`}
      aria-label={t("sheet.trustSource", { label: t(`trust.${trust}`) })}
      onClick={(e) => {
        e.stopPropagation();
        open({ trust, ...(quote && { quote }), ...(sources && { sources }) });
      }}
    >
      {t(`trust.${trust}`)}
      <span className="info" aria-hidden="true">ⓘ</span>
    </button>
  );
}

/** A side panel on a wide screen, a sheet from the bottom on a phone. */
export function SideSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="side-sheet"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section>
        <div className="side-sheet-grip" aria-hidden="true" />
        <header>
          <h2 id={titleId}>{title}</h2>
          <button aria-label={t("common.close")} className="round-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </dialog>
  );
}

function SourceSheet({
  detail,
  fallback,
  onReport,
  onClose,
}: {
  detail: SourceDetail;
  fallback: string;
  onReport: () => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const tr = lang === "en" ? "tr" : undefined;
  const { trust, quote, sources = [] } = detail;
  return (
    <SideSheet title={t("sheet.title")} onClose={onClose}>
      {quote && <blockquote className="sheet-quote">“{shorten(quote)}”</blockquote>}
      <div className="sheet-trust">
        <span className={`tag ${trustTones[trust]}`}>{t(`trust.${trust}`)}</span>
        <p>
          {t(`trust.${trust}`)}:{" "}
          {t(`trustMeaning.${trust}`).replace(/^./, (c) => c.toLocaleLowerCase(lang === "en" ? "en" : "tr"))}
        </p>
      </div>
      <h3>{t("sheet.sources")}</h3>
      {sources.length ? (
        sources.map((s) => (
          <div className="sheet-source" key={s.title} lang={tr}>
            <b>{s.title}</b>
            {s.detail && <small>{s.detail}</small>}
          </div>
        ))
      ) : (
        <p className="muted">
          {t("sheet.noSource")}
          {fallback && ` ${t("sheet.generalSource", { source: fallback })}`}
        </p>
      )}
      <h4>{t("sheet.otherLabels")}</h4>
      <ul className="sheet-trust-list">
        {TRUSTS.filter((other) => other !== trust).map((other) => (
          <li key={other}>
            <span className={`tag ${trustTones[other]}`}>{t(`trust.${other}`)}</span>
            <span>{t(`trustMeaning.${other}`)}</span>
          </li>
        ))}
      </ul>
      <button className="text-btn sheet-report" onClick={onReport}>
        {t("sheet.report")}
      </button>
    </SideSheet>
  );
}

/** Provides `TrustTag` with its sheet. `report` receives the statement a visitor flags as wrong. */
export function SourceSheetProvider({
  fallback,
  report,
  children,
}: {
  fallback: string;
  report: (detail: SourceDetail) => void;
  children: ReactNode;
}) {
  const [detail, setDetail] = useState<SourceDetail | null>(null);
  const open = useCallback((next: SourceDetail) => setDetail(next), []);
  return (
    <SheetContext.Provider value={open}>
      {children}
      {detail && (
        <SourceSheet
          detail={detail}
          fallback={fallback}
          onReport={() => {
            report(detail);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </SheetContext.Provider>
  );
}

const WAQF_QUOTE =
  "Ticaretin sürdüğü çarşı, han ve kervansaray gibi yapılar İslam tarihinin her döneminde inşa edilmiştir. Bu yapıların bakım ve işletme giderleri çoğu kez vakıflar aracılığıyla karşılanmış, aynı zamanda bu yapılardan elde edilen gelirlerle cami, mektep ve medrese gibi hayrat eserlerin ihtiyaçları desteklenmiştir.";

/** «Vakıf nedir?»: the two faces of a waqf, a passage of the inventory, and one example from the catalog. */
export function WaqfSheet({
  sites,
  inventory,
  onSite,
  onClose,
}: {
  sites: HeritageSite[];
  /** Name of the inventory the passage comes from. */
  inventory: string;
  onSite: (id: string) => void;
  onClose: () => void;
}) {
  const { lang, t, text } = useI18n();
  const tr = lang === "en" ? "tr" : undefined;
  const example = useMemo(() => {
    for (const site of sites)
      if (site.kind === "han" || site.kind === "bedesten" || site.kind === "hamam")
        for (const story of site.stories)
          if (/vakfedil/i.test(story.text)) return { site, story };
    return null;
  }, [sites]);
  return (
    <SideSheet title={t("waqf.title")} onClose={onClose}>
      <p>{t("waqf.intro")}</p>
      <ul className="waqf-roles">
        <li>
          <i className="dot dini" />
          <div>
            <b>{t("waqf.hayrat")}</b>
            <small>{t("categoryHint.dini")}</small>
          </div>
        </li>
        <li>
          <i className="dot akar" />
          <div>
            <b>{t("waqf.akar")}</b>
            <small>{t("categoryHint.akar")}</small>
          </div>
        </li>
      </ul>
      <h3>{t("waqf.bookSays")}</h3>
      <blockquote className="sheet-quote" lang={tr}>“{WAQF_QUOTE}”</blockquote>
      <div className="waqf-credit">
        <TrustTag
          trust="verified"
          quote={WAQF_QUOTE}
          sources={[
            { title: inventory || t("waqf.inventory"), detail: "Cilt 1 · Giriş, «Ticari yapılar»" },
          ]}
        />
        <small>{t("waqf.credit", { inventory: inventory || t("waqf.inventory") })}</small>
      </div>
      {example && (
        <>
          <h3>{t("waqf.example")}</h3>
          <button
            className="waqf-example"
            onClick={() => onSite(example.site.id)}
          >
            <span>
              <b>{text(example.site.name, example.site.nameEn)}</b>
              <small><Localized tr={example.story.text} en={example.story.textEn} /></small>
            </span>
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </SideSheet>
  );
}
