"use client";
import { useMemo, useState } from "react";
import { sized } from "../lib/image-size";
import { ChevronLeft, Info, Plus } from "lucide-react";
import { approvedMemories, type Command, type HeritageSite, type Role, type Snapshot } from "@akar/domain";
import { memoryTraces, relativeDay, traceInitial, type MemoryFilter, type Trace } from "../lib/memory-traces";
import type { MessageKey } from "../lib/messages";
import { accusative, cityCase } from "../lib/place-names";
import { Lightbox, useWide, type Shown } from "./about-reading";
import { useI18n } from "./i18n";
import { MemoryActions } from "./memory-actions";

/** How many traces show before «Daha fazla göster» (prototype `hz.sinir`). */
const PAGE = 10;

/** A trace with the site it belongs to: «Tümünü gör» lists every site's. */
type SiteTrace = Trace & { site: HeritageSite };

function tracesOf(site: HeritageSite, state: Snapshot): SiteTrace[] {
  return memoryTraces({
    sample: site.sampleTraces ?? [],
    own: state.memories.filter((m) => m.siteId === site.id),
    approved: approvedMemories(state, site.id),
  }).map((trace) => ({ ...trace, site }));
}

/**
 * One trace (prototype `hzdKart` on a wide screen, `hzKart` on a phone): a photo in its own frame, or a written
 * memory set as a large serif quote; who, when, its tags, and the visitor's own report/remove buttons.
 */
function TraceCard({
  trace,
  wide,
  all,
  role,
  commit,
  onPhoto,
  onSite,
}: {
  trace: SiteTrace;
  wide: boolean;
  all: boolean;
  role: Role;
  commit: (command: Command) => Promise<boolean>;
  onPhoto: (trace: SiteTrace) => void;
  onSite: (id: string) => void;
}) {
  const { t, lang, text } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const angle = trace.historyImageId ? trace.site.historyImages?.find((h) => h.id === trace.historyImageId) : undefined;
  const angleText = angle
    ? /\d/.test(angle.dateLabel)
      ? t("memoryPage.angleWith", { date: angle.dateLabel })
      : t("memoryPage.angleOld")
    : "";
  const tag =
    trace.state === "pending" ? (
      <span className="hz-etiket bekliyor">{t("memoryPage.reviewing")}</span>
    ) : trace.state === "sample" ? (
      <span className="hz-etiket ornek">{t("site.sampleTrace")}</span>
    ) : null;
  const siteTag = all && (
    <button className="hz-eser" onClick={() => onSite(trace.site.id)}>
      {text(trace.site.name, trace.site.nameEn)}
    </button>
  );
  const photo = trace.photo && (
    <button className={wide ? "hzd-foto" : "hz-foto"} onClick={() => onPhoto(trace)} aria-label={trace.alt || t("memories.photoAlt")}>
      <img src={sized(trace.photo, 400)} alt={trace.alt || t("memories.photoAlt")} loading="lazy" decoding="async" />
      {angleText && <span className="hz-aci">{angleText}</span>}
    </button>
  );
  const actions = trace.memory && (
    <div className="memory-actions">
      <MemoryActions memory={trace.memory} siteName={trace.site.name} role={role} own={trace.own} commit={commit} />
    </div>
  );
  const credit = trace.credit && (
    <small className="hm-kunye" lang={content}>
      {trace.credit}
    </small>
  );
  if (wide)
    return (
      <article className={`hzd-iz${trace.photo ? " fotolu" : ""}${trace.own ? " benim" : ""}`}>
        {photo}
        {trace.text && (
          <p className={`hzd-metin${trace.photo ? "" : " alinti"}${trace.text.length > 140 ? " uzun" : ""}`} lang={content}>
            {trace.text}
          </p>
        )}
        <div className="hzd-kim">
          <span className="hz-avatar" aria-hidden="true">
            {traceInitial(trace.author)}
          </span>
          <div>
            <b lang={content}>{trace.author}</b>
            <small>{relativeDay(trace.date, lang)}</small>
          </div>
        </div>
        {(tag || siteTag) && (
          <div className="hzd-etiketler">
            {tag}
            {siteTag}
          </div>
        )}
        {credit}
        {actions}
      </article>
    );
  return (
    <article className={`hz-iz${trace.photo ? " fotolu" : ""}`}>
      {photo}
      <div className="hz-govde">
        {trace.text && <p lang={content}>{trace.text}</p>}
        <div className="hz-ayak">
          <span lang={content}>
            {trace.author} · {relativeDay(trace.date, lang)}
          </span>
          {tag}
          {siteTag}
        </div>
        {credit}
        {actions}
      </div>
    </article>
  );
}

/**
 * «Yaşayan hafıza» (prototype `hafizaCiz`, 30 Oct second design). A wide screen gets a cover with the site's photo,
 * a filter bar that sticks, and a three-column wall opening with an invitation; a phone a compact head, the list and
 * a fixed «İz Bırak». «Tümünü gör» lists every site's traces (this site's first) with a city and a site picker.
 */
export function LivingMemory({
  site,
  sites,
  state,
  role,
  commit,
  onBack,
  onAdd,
  onHistory,
  onListen,
  onSite,
}: {
  site: HeritageSite;
  /** Every published site: «Tümünü gör» gathers their traces. */
  sites: HeritageSite[];
  state: Snapshot;
  role: Role;
  commit: (command: Command) => Promise<boolean>;
  onBack: () => void;
  onAdd: () => void;
  onHistory: () => void;
  onListen: () => void;
  /** Another site's page (a trace's site tag); `memory` opens that site's living memory. */
  onSite: (id: string, memory?: boolean) => void;
}) {
  const { t, lang, text } = useI18n();
  const wide = useWide();
  const [all, setAll] = useState(false),
    [filter, setFilter] = useState<MemoryFilter>("all"),
    [limit, setLimit] = useState(PAGE),
    [city, setCity] = useState(site.city),
    [pick, setPick] = useState("all"),
    [open, setOpen] = useState<number | null>(null);
  const name = text(site.name, site.nameEn);
  const everyTrace = useMemo(() => sites.flatMap((s) => tracesOf(s, state)), [sites, state]);
  const own = useMemo(() => tracesOf(site, state), [site, state]);
  const inCity = everyTrace.filter((trace) => trace.site.city === site.city);
  // «Tümü» keeps the opened site's traces first, then the others'.
  let base: SiteTrace[] = all ? [...own, ...everyTrace.filter((trace) => trace.site.id !== site.id)] : own;
  if (all && city !== "all") base = base.filter((trace) => trace.site.city === city);
  if (all && pick !== "all") base = base.filter((trace) => trace.site.id === pick);
  const count = {
    photo: base.filter((trace) => trace.photo).length,
    angle: base.filter((trace) => trace.historyImageId).length,
  };
  const shown = base.filter(
    (trace) =>
      filter === "all" ||
      (filter === "photo" && !!trace.photo) ||
      (filter === "angle" && !!trace.historyImageId) ||
      (filter === "mine" && trace.own),
  );
  const visible = shown.slice(0, limit);
  const rest = shown.length - visible.length;
  const photos = visible.filter((trace) => trace.photo);
  const lightbox: Shown[] = photos.map((trace) => ({
    src: trace.photo!,
    alt: trace.alt || t("memories.photoAlt"),
    caption: [trace.author, relativeDay(trace.date, lang), trace.credit].filter(Boolean).join(" · "),
  }));
  const allLabel = site.city
    ? t("hm.allIn", { cityIn: cityCase(site.city), city: site.city, n: inCity.length })
    : t("hm.allAny", { n: everyTrace.length });
  const choose = (next: MemoryFilter) => {
    setFilter(next);
    setLimit(PAGE);
  };
  const FILTERS: Array<[MemoryFilter, MessageKey, number]> = [
    ["all", "memoryPage.newest", 0],
    ["photo", "memoryPage.withPhoto", count.photo],
    ["angle", wide ? "memoryPage.sameAngle" : "hm.sameAngleShort", count.angle],
    ["mine", "memoryPage.mine", 0],
  ];
  const chips = (
    <div className="hz-suzgec" role="group" aria-label={t("memoryPage.filters")}>
      {FILTERS.map(([id, label, n]) => (
        <button key={id} className={`chip${filter === id ? " dark" : ""}`} aria-pressed={filter === id} onClick={() => choose(id)}>
          {t(label)}
          {n ? ` · ${n}` : ""}
        </button>
      ))}
    </div>
  );
  const cities = [...new Set(sites.map((s) => s.city).filter(Boolean))];
  const pickable = sites
    .filter((s) => city === "all" || s.city === city)
    .map((s) => [s, everyTrace.filter((trace) => trace.site.id === s.id).length] as const)
    .filter(([, n]) => n)
    .sort((a, b) => b[1] - a[1]);
  const pickedTotal = pickable.reduce((n, [, k]) => n + k, 0);
  const pickers = all && (
    <div className="hz-seciciler">
      <label>
        <span>{t("hm.cityLabel")}</span>
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPick("all");
          }}
        >
          <option value="all">{t("hm.allCities", { n: everyTrace.length })}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c} · {everyTrace.filter((trace) => trace.site.city === c).length}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("hm.siteLabel")}</span>
        <select value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="all">{t("hm.allSites", { n: pickedTotal })}</option>
          {pickable.map(([s, n]) => (
            <option key={s.id} value={s.id}>
              {text(s.name, s.nameEn)} · {n}
            </option>
          ))}
        </select>
      </label>
      <small>{t("hm.summary", { sites: pickable.length, n: pickedTotal })}</small>
    </div>
  );
  const cards = visible.map((trace) => (
    <TraceCard
      key={`${trace.site.id}-${trace.id}`}
      trace={trace}
      wide={wide}
      all={all}
      role={role}
      commit={commit}
      onPhoto={(item) => setOpen(photos.indexOf(item))}
      onSite={(id) => onSite(id)}
    />
  ));
  const sampleNote = base.some((trace) => trace.state === "sample") && (
    <p className="hz-ornek-not">
      <Info size={14} />
      <span>{t("site.sampleNote")}</span>
    </p>
  );
  const more = rest > 0 && (
    <button className={wide ? "hz-daha hzd-daha" : "hz-daha"} onClick={() => setLimit(limit + PAGE)}>
      {t("hm.more", { n: rest })}
    </button>
  );
  const invites = filter === "all" || filter === "mine";
  const empty = !shown.length && (
    <div className="hz-bos">
      <b>{t(filter === "all" || filter === "mine" ? "memories.emptyTitle" : "hm.emptyFilter")}</b>
      {filter === "all" || filter === "mine" ? t("memories.emptyText") : t("hm.emptyFilterText")}
    </div>
  );
  const box = open !== null && (
    <Lightbox photos={lightbox} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
  );
  const back = () => (all ? setAll(false) : onBack());
  if (wide) {
    const cover = site.photos?.find((p) => p.id === site.coverPhotoId) ?? site.photos?.[0];
    const numbers = (
      [
        [base.length, "hm.nTraces"],
        [count.photo, "hm.nPhotos"],
        [count.angle, "hm.nAngles"],
      ] as const
    ).filter(([n], k) => k === 0 || n);
    const nearby = sites
      .filter((s) => s.city === site.city)
      .map((s) => [s, everyTrace.filter((trace) => trace.site.id === s.id).length] as const)
      .filter(([, n]) => n)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return (
      <main id="main-content" tabIndex={-1} className="hz hz-d">
        <header className="hzd-kapak">
          {cover && <img className="hzd-kapak-foto" src={sized(cover.src, 1200)} alt="" aria-hidden="true" decoding="async" />}
          <div className="hzd-kapak-ic">
            <button className="hzd-geri" onClick={back}>
              <ChevronLeft size={16} />
              {all ? t("hm.backToMemory") : name}
            </button>
            <div className="hzd-bas">
              <span className="hzd-ust">
                {t("hm.eyebrow")}
                {site.city ? ` · ${site.city}` : ""}
              </span>
              <h1 className="hzd-h1">
                {all ? t("hm.city") : name}
                <br />
                <em>{t("hm.of")}</em>
              </h1>
              <p className="hzd-alt">
                {all ? t("hm.subAll") : t("hm.sub", { name: lang === "tr" ? accusative(name) : name })}
              </p>
            </div>
            <div className="hzd-kapak-alt">
              <div className="hzd-sayilar">
                {numbers.map(([n, label]) => (
                  <span key={label}>
                    <b>{n}</b>
                    {t(label)}
                  </span>
                ))}
              </div>
              <button className="btn hzd-ekle" onClick={onAdd}>
                <Plus size={18} />
                {t("hm.leave")}
              </button>
            </div>
          </div>
        </header>
        <div className="hzd-cubuk">
          <div className="hzd-cubuk-ic">
            {chips}
            {pickers}
            {!all && (
              <button className="hzd-tumu" onClick={() => setAll(true)}>
                {allLabel} ›
              </button>
            )}
          </div>
        </div>
        <div className="hzd-icerik">
          {sampleNote}
          {(shown.length > 0 || invites) && (
            <div className="hzd-duvar">
              {invites && (
                <button className="hzd-davet" onClick={onAdd}>
                  <span className="hzd-tirnak" aria-hidden="true">
                    “
                  </span>
                  <b>{t("memoryPage.yours")}</b>
                  <span>{t(all ? "hm.inviteAll" : "hm.inviteText")}</span>
                  <span className="hzd-davet-btn">
                    <Plus size={16} />
                    {t("hm.leave")}
                  </span>
                  <small>{t("hm.inviteNote")}</small>
                </button>
              )}
              {cards}
            </div>
          )}
          {!invites && empty}
          {more}
          <div className="hzd-alt-link">
            {all ? (
              <>
                <b>{site.city ? t("hm.mostIn", { cityIn: cityCase(site.city), city: site.city }) : t("hm.mostAny")}</b>
                {nearby.map(([s, n]) => (
                  <button key={s.id} onClick={() => onSite(s.id, true)}>
                    {t("hm.siteN", { name: text(s.name, s.nameEn), n })} ›
                  </button>
                ))}
              </>
            ) : (
              <>
                <b>{t("hm.onSite")}</b>
                {site.stories.length > 0 && <button onClick={onListen}>{t("hm.listen", { min: site.minutes })} ›</button>}
                {!!site.historyImages?.length && (
                  <button onClick={onHistory}>{t("hm.historyN", { n: site.historyImages.length })} ›</button>
                )}
                <button onClick={onBack}>{t("hm.sitePage")} ›</button>
              </>
            )}
          </div>
        </div>
        {box}
      </main>
    );
  }
  return (
    <main id="main-content" tabIndex={-1} className="hz hz-m">
      <header className="gv-ust">
        <button className="yuvarlak" onClick={back} aria-label={t("gg.back")}>
          <ChevronLeft size={20} />
        </button>
        <div className="gv-ust-yazi">
          <h1>{t("hm.eyebrow")}</h1>
          <small>{all ? t("hm.mobileAll", { n: base.length }) : t("hm.mobileSite", { name, n: base.length })}</small>
        </div>
        <span style={{ width: 40 }} />
      </header>
      <div className="hz-kaydir">
        {pickers}
        {chips}
        {!all && (
          <button className="hz-tumu" onClick={() => setAll(true)}>
            {t("hm.seeAll", { label: allLabel })} ›
          </button>
        )}
        {sampleNote}
        <div className="hz-liste">{cards}</div>
        {empty}
        {more}
      </div>
      <div className="hz-alt-cubuk">
        <button className="btn full" onClick={onAdd}>
          <Plus size={18} />
          {t("hm.leave")}
        </button>
      </div>
      {box}
    </main>
  );
}
