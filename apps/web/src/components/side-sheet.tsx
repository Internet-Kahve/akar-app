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
import {
  categoryHints,
  trustLabels,
  type HeritageSite,
  type Trust,
} from "@akar/domain";

const trustMeanings: Record<Trust, string> = {
  verified: "Bilgi en az bir güvenilir kaynakta açıkça yer alıyor.",
  inferred: "Kaynaklardan yorumlanan bilgi.",
  representative: "Görsel ya da model yaklaşık.",
};
const trustTones: Record<Trust, string> = {
  verified: "success",
  inferred: "warning",
  representative: "representative",
};
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
  return (
    <button
      type="button"
      className={`tag trust-tag ${trustTones[trust]}`}
      aria-label={`${trustLabels[trust]}: kaynağını gör`}
      onClick={(e) => {
        e.stopPropagation();
        open({ trust, ...(quote && { quote }), ...(sources && { sources }) });
      }}
    >
      {trustLabels[trust]}
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
          <button aria-label="Kapat" className="round-btn" onClick={onClose}>
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
  const { trust, quote, sources = [] } = detail;
  return (
    <SideSheet title="Bu bilgi nereden geliyor?" onClose={onClose}>
      {quote && <blockquote className="sheet-quote">“{shorten(quote)}”</blockquote>}
      <div className="sheet-trust">
        <span className={`tag ${trustTones[trust]}`}>{trustLabels[trust]}</span>
        <p>
          {trustLabels[trust]}:{" "}
          {trustMeanings[trust].replace(/^./, (c) => c.toLocaleLowerCase("tr"))}
        </p>
      </div>
      <h3>Kaynaklar</h3>
      {sources.length ? (
        sources.map((s) => (
          <div className="sheet-source" key={s.title}>
            <b>{s.title}</b>
            {s.detail && <small>{s.detail}</small>}
          </div>
        ))
      ) : (
        <p className="muted">
          Bu öğenin ayrı kaynak satırı yok.
          {fallback && ` Genel kaynak: ${fallback}`}
        </p>
      )}
      <h4>Diğer etiketler</h4>
      <ul className="sheet-trust-list">
        {(Object.keys(trustLabels) as Trust[])
          .filter((t) => t !== trust)
          .map((t) => (
            <li key={t}>
              <span className={`tag ${trustTones[t]}`}>{trustLabels[t]}</span>
              <span>{trustMeanings[t]}</span>
            </li>
          ))}
      </ul>
      <button className="text-btn sheet-report" onClick={onReport}>
        Bir hata mı gördün? Bildir ›
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
  const example = useMemo(() => {
    for (const site of sites)
      if (site.kind === "han" || site.kind === "bedesten" || site.kind === "hamam")
        for (const story of site.stories)
          if (/vakfedil/i.test(story.text)) return { site, story };
    return null;
  }, [sites]);
  return (
    <SideSheet title="Vakıf nedir?" onClose={onClose}>
      <p>
        Vakıf, bir malın ya da gelirin kalıcı olarak bir hayır işine
        bağlanmasıdır. Haritadaki eserler bu düzenin iki yüzüdür:
      </p>
      <ul className="waqf-roles">
        <li>
          <i className="dot dini" />
          <div>
            <b>Hayrat · Dinî</b>
            <small>{categoryHints.dini}</small>
          </div>
        </li>
        <li>
          <i className="dot akar" />
          <div>
            <b>Akar · Ticari</b>
            <small>{categoryHints.akar}</small>
          </div>
        </li>
      </ul>
      <h3>Kitap ne diyor?</h3>
      <blockquote className="sheet-quote">“{WAQF_QUOTE}”</blockquote>
      <div className="waqf-credit">
        <TrustTag
          trust="verified"
          quote={WAQF_QUOTE}
          sources={[
            { title: inventory || "Envanter", detail: "Cilt 1 · Giriş, «Ticari yapılar»" },
          ]}
        />
        <small>{inventory || "Envanter"}, Cilt 1 · Giriş</small>
      </div>
      {example && (
        <>
          <h3>Bu şehirde bir örnek</h3>
          <button
            className="waqf-example"
            onClick={() => onSite(example.site.id)}
          >
            <span>
              <b>{example.site.name}</b>
              <small>{example.story.text}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </SideSheet>
  );
}
