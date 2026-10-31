"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  History,
  Maximize2,
  Pause,
  Play,
  Puzzle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import {
  type AboutChapter,
  type AboutPhoto,
  type HeritageSite,
  type SitePhoto,
} from "@akar/domain";
import { useCityIdentity, useCityScene } from "./city-scenes";
import { ModelStage } from "./model-stage";
import { Modal, Notice, Tag } from "./ui";
import { Localized, useI18n } from "./i18n";
import {
  STRIP_MAX,
  chapterBlocks,
  chapterPages,
  dominantTrust,
  photoRatio,
  readingMinutes,
  splitTerms,
  wordCount,
  type Block,
} from "../lib/about-reading";

type Section = NonNullable<HeritageSite["sections"]>[number];
type Term = AboutChapter["terms"][number];

/** Wide screens read with the 3D model beside the text; narrow ones never load it. */
const WIDE = "(min-width: 1000px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function useWide() {
  return useSyncExternalStore(
    (notify) => {
      const query = matchMedia(WIDE);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => matchMedia(WIDE).matches,
    () => false,
  );
}

const pad = (n: number) => String(n + 1).padStart(2, "0");
const RATES = [1, 1.25, 1.5];
const GLIDE = (): ScrollBehavior => (matchMedia(REDUCED_MOTION).matches ? "auto" : "smooth");

/** Where the page lays its next steps; absent ones are left out. */
interface AboutActions {
  onStory?: (() => void) | undefined;
  onHistory?: (() => void) | undefined;
  onPuzzle?: (() => void) | undefined;
}

/** The reading page under the top bar: the whole page on a phone. Escape leaves it. */
function ReadingPage({
  site,
  chapters,
  onClose,
  ...actions
}: { site: HeritageSite; chapters: AboutChapter[]; onClose: () => void } & AboutActions) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div className="about-page" role="dialog" aria-label={t("site.aboutTitle")} tabIndex={-1} ref={ref}>
      <Reading site={site} chapters={chapters} onClose={onClose} {...actions} />
    </div>
  );
}

/** "Eser hakkında": the reading layout for a site with chapters, the plain paragraphs for one without. */
export function AboutModal({
  site,
  onClose,
  ...actions
}: {
  site: HeritageSite;
  onClose: () => void;
} & AboutActions) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  if (site.chapters?.length)
    return <ReadingPage site={site} chapters={site.chapters} onClose={onClose} {...actions} />;
  return (
    <Modal title={t("site.aboutTitle")} onClose={onClose}>
      <h3>
        <Localized tr={site.name} en={site.nameEn} />
      </h3>
      <p>
        <Localized tr={site.description} en={site.descriptionEn} />
      </p>
      <dl className="facts">
        {site.year && (
          <div>
            <dt>{t("site.aboutPeriod")}</dt>
            <dd lang={content}>{site.year}</dd>
          </div>
        )}
        <div>
          <dt>{t("site.aboutArchitect")}</dt>
          <dd lang={content}>{site.architect}</dd>
        </div>
        <div>
          <dt>{t("site.aboutLocation")}</dt>
          <dd lang={content}>
            {site.city} · {site.district}
          </dd>
        </div>
      </dl>
      {site.sections?.map((section) => (
        <section key={section.id}>
          <h3 lang={content}>{section.title}</h3>
          <p lang={content}>{section.body}</p>
          <Tag tone={section.trust}>{t(`trust.${section.trust}`)}</Tag>
          <p className="muted" lang={content}>
            {site.sources?.find((source) => source.id === section.sourceId)?.title}
          </p>
        </section>
      ))}
      <h3>{t("site.aboutSourceStatus")}</h3>
      <p lang={content}>{site.source}</p>
      {!site.sources?.length && <Notice>{t("site.noSourcePack")}</Notice>}
    </Modal>
  );
}

interface Shown {
  src: string;
  alt: string;
  caption: string;
}
interface OpenTerm {
  term: Term;
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

const toShown = (p: AboutPhoto): Shown => ({
  src: p.photo.src,
  alt: p.alt || p.photo.alt,
  caption: [p.alt || p.photo.alt, p.photo.license].filter(Boolean).join(" · "),
});

function Reading({
  site,
  chapters,
  onClose,
  onStory,
  onHistory,
  onPuzzle,
}: {
  site: HeritageSite;
  chapters: AboutChapter[];
  onClose: () => void;
} & AboutActions) {
  const i18n = useI18n();
  const { t, lang } = i18n;
  const content = lang === "en" ? "tr" : undefined;
  const wide = useWide();
  const cityScene = useCityScene(site.city);
  const identity = useCityIdentity(site.city);
  const scroller = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [lightbox, setLightbox] = useState<{ photos: Shown[]; index: number } | null>(null);
  const [term, setTerm] = useState<OpenTerm | null>(null);
  const [pastCover, setPastCover] = useState(false);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  /** Reading aloud: the chapter, its paragraph and whether the page follows it. */
  const [voice, setVoice] = useState<{
    chapter: number;
    paragraph: number;
    playing: boolean;
    rate: number;
    follow: boolean;
    total: number;
  } | null>(null);
  const canSpeak = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );

  const sections = useMemo(() => site.sections ?? [], [site.sections]);
  const grouped = useMemo(
    () =>
      chapters.map((chapter) => {
        const own = sections.filter((s) => s.chapterId === chapter.id);
        return {
          chapter,
          sections: own,
          blocks: chapterBlocks(own, chapter.summary),
          trust: dominantTrust(own),
          cover: own.flatMap((s) => s.photos ?? [])[0],
        };
      }),
    [chapters, sections],
  );
  const ids = new Set(chapters.map((c) => c.id));
  const loose = sections.filter((s) => !s.chapterId || !ids.has(s.chapterId));
  const totalWords = wordCount(sections);
  const cover =
    site.aboutCover ??
    site.photos?.find((p) => p.id === site.coverPhotoId) ??
    site.photos?.[0];
  const sourceTitle = (id: string) => site.sources?.find((s) => s.id === id)?.title;
  const usedSources = [
    ...new Set(sections.map((s) => sourceTitle(s.sourceId)).filter(Boolean)),
  ];
  const showModel =
    wide && !!site.model && chapters.some((c) => c.camera || c.focusParts.length);
  const current = grouped[active] ?? grouped[0]!;
  const sidePhoto: SitePhoto | undefined = current.cover?.photo ?? cover;

  // The chapter in the reading band drives the tab, the progress bar and the model.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const onScroll = () => {
      setTerm(null);
      progress.current?.style.setProperty(
        "transform",
        `scaleX(${Math.min(1, root.scrollTop / Math.max(1, root.scrollHeight - root.clientHeight))})`,
      );
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    const chapterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.chapter));
      },
      { root, rootMargin: "-35% 0px -60% 0px" },
    );
    root.querySelectorAll("[data-chapter]").forEach((el) => chapterObserver.observe(el));
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("seen");
            reveal.unobserve(entry.target);
          }
      },
      { root, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll(".about-reveal").forEach((el) => reveal.observe(el));
    return () => {
      root.removeEventListener("scroll", onScroll);
      chapterObserver.disconnect();
      reveal.disconnect();
    };
  }, []);

  // Keep the active tab in view inside the tab strip only (the page itself must not jump).
  useEffect(() => {
    const strip = tabs.current;
    const tab = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !tab) return;
    strip.scrollTo({
      left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2,
      behavior: matchMedia(REDUCED_MOTION).matches ? "auto" : "smooth",
    });
  }, [active]);

  // An open definition closes on a tap elsewhere or Escape (Escape must not also close the page).
  useEffect(() => {
    if (!term) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest(".about-term-card, .about-term")) setTerm(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setTerm(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [term]);

  const goTo = (index: number) =>
    document.getElementById(`about-chapter-${grouped[index]!.chapter.id}`)?.scrollIntoView({
      block: "start",
      behavior: matchMedia(REDUCED_MOTION).matches ? "auto" : "smooth",
    });
  const toggle = (id: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const showTerm = (t: Term, el: HTMLElement) => {
    if (term?.term === t) return setTerm(null);
    const rect = el.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    // Below the word, above it when the lower part of the screen is short.
    const below = window.innerHeight - rect.bottom > 190;
    setTerm({
      term: t,
      left,
      width,
      ...(below
        ? { top: rect.bottom + 8 }
        : { bottom: window.innerHeight - rect.top + 8 }),
    });
  };
  const meta = [site.year, site.patron ?? site.architect, site.kind].filter(Boolean).join(" · ");
  const paragraphs = (chapter: number) => [
    ...(scroller.current?.querySelectorAll<HTMLElement>(
      `[data-chapter="${chapter}"] :is(.about-p, .about-inscription-meaning)`,
    ) ?? []),
  ];
  const listen = (chapter: number) => {
    window.speechSynthesis.cancel();
    setVoice({ chapter, paragraph: 0, playing: true, rate: voice?.rate ?? 1, follow: true, total: 0 });
  };
  // One effect owns the speech: any change of place, speed or state restarts it from that paragraph.
  useEffect(() => {
    if (!voice) return;
    const list = paragraphs(voice.chapter);
    if (voice.paragraph >= list.length) {
      setVoice(
        voice.chapter + 1 < grouped.length
          ? { ...voice, chapter: voice.chapter + 1, paragraph: 0 }
          : null,
      );
      return;
    }
    const id = grouped[voice.chapter]!.chapter.id;
    setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    if (voice.total !== list.length) setVoice({ ...voice, total: list.length });
    const el = list[voice.paragraph]!;
    el.classList.add("about-reading-now");
    if (voice.follow) el.scrollIntoView({ block: "center", behavior: GLIDE() });
    let live = true;
    if (voice.playing) {
      const title = voice.paragraph === 0 ? `${grouped[voice.chapter]!.chapter.title}. ` : "";
      const utterance = new SpeechSynthesisUtterance(title + (el.textContent ?? "").trim());
      utterance.lang = "tr-TR";
      utterance.rate = voice.rate;
      utterance.onend = () => {
        if (live) setVoice((v) => v && { ...v, paragraph: v.paragraph + 1 });
      };
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      live = false;
      el.classList.remove("about-reading-now");
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice?.chapter, voice?.paragraph, voice?.playing, voice?.rate]);
  useEffect(() => {
    const root = scroller.current;
    if (!root || !voice?.follow) return;
    const stop = () => setVoice((v) => v && { ...v, follow: false });
    root.addEventListener("wheel", stop, { passive: true });
    root.addEventListener("touchmove", stop, { passive: true });
    return () => {
      root.removeEventListener("wheel", stop);
      root.removeEventListener("touchmove", stop);
    };
  }, [voice?.follow]);
  // The back button joins the tabs once the cover, which has its own, has left the screen.
  useEffect(() => {
    const root = scroller.current,
      cover = root?.querySelector(".about-cover");
    if (!root || !cover) return;
    const seen = new IntersectionObserver(([entry]) => setPastCover(!entry!.isIntersecting), { root });
    seen.observe(cover);
    return () => seen.disconnect();
  }, []);
  // The arrows appear only on the side where the tabs go on.
  useEffect(() => {
    const strip = tabs.current;
    if (!strip) return;
    const measure = () =>
      setOverflow({
        left: strip.scrollLeft > 4,
        right: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4,
      });
    measure();
    strip.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      strip.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);
  const name = i18n.text(site.name, site.nameEn);
  const inventory = site.source?.split(" · ")[0];

  const nav = (
    <nav className={`about-nav${pastCover ? " past-cover" : ""}`} aria-label={t("site.aboutChapters")}>
      <button className="about-nav-back" aria-label={t("puzzle.back", { name })} onClick={onClose}>
        <ChevronLeft size={20} />
        <span>{name}</span>
      </button>
      <button
        className="about-tab-arrow"
        aria-label={t("site.aboutPrevChapters")}
        hidden={!overflow.left}
        onClick={() => tabs.current?.scrollBy({ left: -240, behavior: "smooth" })}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="about-tabs" ref={tabs}>
        {grouped.map(({ chapter }, i) => (
          <button
            key={chapter.id}
            className="about-tab"
            aria-current={i === active}
            lang={content}
            onClick={() => goTo(i)}
          >
            {chapter.title}
          </button>
        ))}
      </div>
      <button
        className="about-tab-arrow"
        aria-label={t("site.aboutNextChapters")}
        hidden={!overflow.right}
        onClick={() => tabs.current?.scrollBy({ left: 240, behavior: "smooth" })}
      >
        <ChevronRight size={18} />
      </button>
      <i className="about-progress" ref={progress} aria-hidden="true" />
    </nav>
  );

  return (
    <div className="about-scroll" ref={scroller}>
      {!wide && nav}
      <header className="about-cover">
        {wide && (
          <button className="about-back" onClick={onClose}>
            <ChevronLeft size={18} />
            {name}
          </button>
        )}
        {cover && (
          <div className="about-cover-photo">
            <img src={cover.src} alt={cover.alt} />
          </div>
        )}
        <div className="about-cover-panel">
          {site.district && (
            <span className="about-district" lang={content}>
              {site.district}
            </span>
          )}
          <h3 className="about-title">
            <Localized tr={site.name} en={site.nameEn} />
          </h3>
          <span className="about-ornament" aria-hidden="true">
            <i />
            <svg width="24" height="12" viewBox="0 0 24 12">
              <path d="M0 6h7m10 0h7M12 1l4 5-4 5-4-5z" fill="none" stroke="currentColor" />
              <circle cx="12" cy="6" r="1" fill="currentColor" />
            </svg>
            <i />
          </span>
          <p className="about-meta-top" lang={content}>
            {meta}
          </p>
          <p className="about-cover-meta">
            {t(chapters.length === 1 ? "site.aboutCoverMetaOne" : "site.aboutCoverMeta", {
              min: readingMinutes(totalWords),
              n: chapters.length,
            })}
            {inventory && (
              <>
                <br />
                <span lang={content}>{inventory}</span>
              </>
            )}
          </p>
          {canSpeak && (
            <button className="about-listen" onClick={() => listen(0)}>
              <Headphones size={18} />
              {t("site.aboutListen", { min: readingMinutes(totalWords) })}
            </button>
          )}
        </div>
      </header>
      {wide && nav}
      <div className={`about-grid${showModel || (wide && sidePhoto) ? " with-aside" : ""}`}>
        <article className="about-main">
          {grouped.map((g, i) => (
            <ChapterView
              key={g.chapter.id}
              index={i}
              chapter={g.chapter}
              blocks={g.blocks}
              count={g.sections.length}
              words={wordCount(g.sections)}
              trust={g.trust}
              cover={g.cover}
              sources={[
                ...new Set(g.sections.map((s) => sourceTitle(s.sourceId)).filter(Boolean)),
              ] as string[]}
              open={opened.has(g.chapter.id)}
              onToggle={() => toggle(g.chapter.id)}
              onListen={canSpeak ? () => listen(i) : undefined}
              onPhotos={(photos, index) => setLightbox({ photos: photos.map(toShown), index })}
              onTerm={showTerm}
            />
          ))}
          {loose.length > 0 && (
            <section className="about-chapter">
              {loose.map((section: Section) => (
                <div key={section.id}>
                  <h2 className="about-h2" lang={content}>
                    {section.title}
                  </h2>
                  <p className="about-p" lang={content}>
                    {section.body}
                  </p>
                  <Tag tone={section.trust}>{t(`trust.${section.trust}`)}</Tag>
                </div>
              ))}
            </section>
          )}
          <section className="about-end">
            <h2 className="about-h2">{t("site.aboutDone")}</h2>
            <div className="about-next">
              {onStory && site.stories.length > 0 && (
                <button className="btn" onClick={onStory}>
                  <Headphones size={18} />
                  {t("site.aboutStory")}
                </button>
              )}
              {onHistory && (
                <button className="btn secondary" onClick={onHistory}>
                  <History size={18} />
                  {t("site.history")}
                  {site.historyImages?.length ? ` · ${site.historyImages.length}` : ""}
                </button>
              )}
              {onPuzzle && !!site.tasks?.length && (
                <button className="btn secondary" onClick={onPuzzle}>
                  <Puzzle size={18} />
                  {t("site.aboutPuzzle", { count: site.tasks.length })}
                </button>
              )}
            </div>
            <h3 className="about-h3">{t("site.sources")}</h3>
            {usedSources.length > 0 && (
              <ul className="about-sources">
                {usedSources.map((title, i) => (
                  <li key={title} lang={content}>
                    [{i + 1}] {title}
                  </li>
                ))}
              </ul>
            )}
            <p className="about-note">{t("site.aboutSourceNote")}</p>
            {!site.sources?.length && <Notice>{t("site.noSourcePack")}</Notice>}
          </section>
          {voice && (
            <div className="about-player" role="region" aria-label={t("site.aboutVoice")}>
              <div className="about-player-info">
                <b lang={content}>
                  {pad(voice.chapter)} · {grouped[voice.chapter]?.chapter.title}
                </b>
                <small>
                  {t("site.aboutVoiceAt", {
                    n: Math.min(voice.paragraph + 1, voice.total || 1),
                    total: voice.total || 1,
                  })}
                </small>
              </div>
              {!voice.follow && (
                <button
                  className="about-player-back"
                  onClick={() => {
                    setVoice({ ...voice, follow: true });
                    scroller.current
                      ?.querySelector(".about-reading-now")
                      ?.scrollIntoView({ block: "center", behavior: GLIDE() });
                  }}
                >
                  <ChevronDown size={14} />
                  {t("site.aboutVoiceReturn")}
                </button>
              )}
              <div className="about-player-buttons">
                <button
                  aria-label={t("site.aboutPrevParagraph")}
                  onClick={() =>
                    setVoice({ ...voice, follow: true, paragraph: Math.max(0, voice.paragraph - 1) })
                  }
                >
                  <SkipBack size={18} />
                </button>
                <button
                  className="main"
                  aria-label={voice.playing ? t("site.stopAudio") : t("site.startAudio")}
                  onClick={() => setVoice({ ...voice, playing: !voice.playing })}
                >
                  {voice.playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  aria-label={t("site.aboutNextParagraph")}
                  onClick={() => setVoice({ ...voice, follow: true, paragraph: voice.paragraph + 1 })}
                >
                  <SkipForward size={18} />
                </button>
              </div>
              <div className="about-player-buttons">
                <button
                  className="rate"
                  aria-label={t("site.speechRate", { rate: voice.rate })}
                  onClick={() =>
                    setVoice({
                      ...voice,
                      rate: RATES[(RATES.indexOf(voice.rate) + 1) % RATES.length]!,
                    })
                  }
                >
                  {String(voice.rate).replace(".", ",")}×
                </button>
                <button aria-label={t("site.aboutVoiceClose")} onClick={() => setVoice(null)}>
                  <X size={16} />
                </button>
              </div>
              <i className="about-player-line" aria-hidden="true">
                <i style={{ width: `${(100 * Math.min(voice.paragraph + 1, voice.total || 1)) / (voice.total || 1)}%` }} />
              </i>
            </div>
          )}
        </article>
        {wide && (showModel || sidePhoto) && (
          <aside
            className="about-aside"
            aria-label={showModel ? t("site.aboutModelAside") : t("site.aboutPhotoAside")}
          >
            <div className="about-stage">
              {showModel && site.model ? (
                <ModelStage
                  key={site.model.src}
                  model={site.model}
                  name={i18n.text(site.name, site.nameEn)}
                  scene={cityScene}
                  identity={identity}
                  context="reading"
                  pose={current.chapter.camera}
                  interior={current.chapter.interior}
                  highlight={current.chapter.focusParts}
                  partCards={site.partCards}
                  sources={site.sources}
                />
              ) : (
                sidePhoto && <img src={sidePhoto.src} alt={sidePhoto.alt} />
              )}
              <span className="about-stage-label" aria-live="polite">
                {pad(active)} · <span lang={content}>{current.chapter.title}</span>
              </span>
              {showModel && <span className="about-stage-tag">{t("site.aboutModelTag")}</span>}
            </div>
          </aside>
        )}
      </div>
      {term && (
        <div
          className="about-term-card"
          role="note"
          lang={content}
          style={{
            left: term.left,
            width: term.width,
            ...(term.top !== undefined ? { top: term.top } : { bottom: term.bottom }),
          }}
        >
          <b>{term.term.word}</b>
          <span>{t("site.aboutInBook", { text: term.term.definition })}</span>
        </div>
      )}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndex={(index) => setLightbox({ photos: lightbox.photos, index })}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function ChapterView({
  index,
  chapter,
  blocks,
  count,
  words,
  trust,
  cover,
  sources,
  open,
  onToggle,
  onListen,
  onPhotos,
  onTerm,
}: {
  index: number;
  chapter: AboutChapter;
  blocks: Block[];
  count: number;
  words: number;
  trust: Section["trust"];
  cover?: AboutPhoto | undefined;
  sources: string[];
  open: boolean;
  onToggle: () => void;
  onListen?: (() => void) | undefined;
  onPhotos: (photos: AboutPhoto[], index: number) => void;
  onTerm: (term: Term, el: HTMLElement) => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const pages = chapterPages(sources);
  const [showSources, setShowSources] = useState(false);
  const minutes = readingMinutes(words);
  const hasSummary = chapter.summary.length > 0;
  const headingId = `about-heading-${chapter.id}`;
  const body = (
    <>
      {blocks.map((block) => (
        <BlockView
          key={block.id}
          block={block}
          trust={trust}
          cover={cover}
          terms={chapter.terms}
          onPhotos={onPhotos}
          onTerm={onTerm}
        />
      ))}
    </>
  );
  return (
    <section
      className="about-chapter"
      id={`about-chapter-${chapter.id}`}
      data-chapter={index}
      aria-labelledby={headingId}
    >
      <header className="about-chapter-head about-reveal">
        <div className="about-chapter-title">
          <h2 className="about-h2" id={headingId} lang={content}>
            <span className="about-no">{pad(index)}</span>
            {chapter.title}
          </h2>
          <small>
            {t(count === 1 ? "site.readMetaOne" : "site.readMeta", { min: minutes, n: count })}
            {pages && ` · ${t("site.aboutInventoryPages", { pages })}`}
          </small>
          {onListen && (
            <button
              className="about-chapter-listen"
              aria-label={t("site.aboutListenChapter", { title: chapter.title, min: minutes })}
              onClick={onListen}
            >
              <Play size={14} />
              {t("site.aboutListen", { min: minutes })}
            </button>
          )}
        </div>
        {cover && (
          <BookPhoto
            item={cover}
            className="cover"
            onOpen={() => onPhotos([cover], 0)}
          />
        )}
      </header>
      {hasSummary && (
        <div className="about-summary about-reveal">
          <span className="about-label">{t("site.aboutFromBook")}</span>
          <p lang={content}>{chapter.summary.join(" ")}</p>
        </div>
      )}
      {chapter.figures.length > 0 && (
        <div className="about-figures">
          {chapter.figures.map((figure) => (
            <div
              className="about-figure about-reveal"
              key={`${figure.value}-${figure.label}`}
              lang={content}
            >
              <b>{figure.value}</b>
              <span>{figure.label}</span>
              <small>«{figure.evidence}»</small>
            </div>
          ))}
        </div>
      )}
      {chapter.quotes.map((quote) => (
        <blockquote className="about-quote about-reveal" key={quote.text} lang={content}>
          <span className="about-gold" aria-hidden="true" />
          <p>{quote.text}</p>
          {quote.by && <cite>{quote.by}</cite>}
        </blockquote>
      ))}
      {chapter.timeline.length > 0 && (
        <ol className="about-timeline">
          {chapter.timeline.map((entry) => (
            <li className="about-reveal" key={`${entry.year}-${entry.evidence}`} lang={content}>
              <b>{entry.year}</b>
              <span>«{entry.evidence}»</span>
            </li>
          ))}
        </ol>
      )}
      {hasSummary ? (
        <div className={`about-deep${open ? " open" : ""}`}>
          <div className="about-deep-body" id={`about-text-${chapter.id}`} inert={!open}>
            {body}
          </div>
          <button
            className="about-deep-button"
            aria-expanded={open}
            aria-controls={`about-text-${chapter.id}`}
            onClick={onToggle}
          >
            <span>{open ? t("site.aboutShorten") : t("site.aboutDeeper")}</span>
            <small>
              {t(count === 1 ? "site.deepMetaOne" : "site.deepMeta", { n: count, min: minutes })}
            </small>
            <ChevronDown size={20} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div>{body}</div>
      )}
      <div className="about-chapter-foot">
        <Tag tone={trust}>{t(`trust.${trust}`)}</Tag>
        {sources.length > 0 && (
          <button
            className="about-sources-toggle"
            aria-expanded={showSources}
            onClick={() => setShowSources(!showSources)}
          >
            {t("site.sourcesCount", { n: sources.length })} {showSources ? "⌄" : "›"}
          </button>
        )}
      </div>
      {showSources && (
        <ul className="about-sources">
          {sources.map((title) => (
            <li key={title} lang={content}>
              {title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BlockView({
  block,
  trust,
  cover,
  terms,
  onPhotos,
  onTerm,
}: {
  block: Block;
  trust: Section["trust"];
  cover?: AboutPhoto | undefined;
  terms: Term[];
  onPhotos: (photos: AboutPhoto[], index: number) => void;
  onTerm: (term: Term, el: HTMLElement) => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  // The chapter's first photograph already opens the chapter.
  const photos = block.photos.filter((p) => p !== cover);
  return (
    <>
      {block.kind === "inscription" ? (
        <blockquote className="about-inscription about-reveal">
          <p className="about-inscription-text">{block.original}</p>
          {block.meaning.map((meaning) => (
            <p className="about-inscription-meaning" key={meaning}>
              <span>{t("site.aboutMeaning")}</span>{" "}
              <span lang={content}>{meaning}</span>
            </p>
          ))}
        </blockquote>
      ) : (
        <p className={`about-p${block.inSummary ? " in-summary" : ""}`} lang={content}>
          {splitTerms(block.text, terms).map((part, i) =>
            part.term ? (
              <button
                key={i}
                className="about-term"
                aria-haspopup="dialog"
                onClick={(e) => onTerm(part.term!, e.currentTarget)}
              >
                {part.text}
              </button>
            ) : (
              part.text
            ),
          )}
        </p>
      )}
      {block.trust !== trust && (
        <div className="about-p-trust">
          <Tag tone={block.trust}>{t(`trust.${block.trust}`)}</Tag>
        </div>
      )}
      {photos.length > 0 && <PhotoGroup photos={photos} onOpen={onPhotos} />}
    </>
  );
}

/** One book photograph: the box follows the stored book ratio until the file loads, then the file's own ratio (never cropped). */
function BookPhoto({
  item,
  className = "",
  onOpen,
}: {
  item: AboutPhoto;
  className?: string;
  onOpen: () => void;
}) {
  const { t, lang } = useI18n();
  const [natural, setNatural] = useState<number>();
  const alt = item.alt || item.photo.alt;
  return (
    <button
      className={`about-photo ${className}`.trim()}
      style={{ "--ratio": photoRatio(item.aspect, natural) } as CSSProperties}
      aria-label={t("site.aboutEnlarge", { alt })}
      onClick={onOpen}
    >
      <img
        src={item.photo.src}
        alt={alt}
        lang={lang === "en" ? "tr" : undefined}
        loading="lazy"
        decoding="async"
        onLoad={(e) =>
          setNatural(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1))
        }
      />
      <Maximize2 size={16} aria-hidden="true" />
    </button>
  );
}

/** Photographs behind one paragraph: a strip up to `STRIP_MAX`, a grid beyond (plate collages). */
function PhotoGroup({
  photos,
  onOpen,
}: {
  photos: AboutPhoto[];
  onOpen: (photos: AboutPhoto[], index: number) => void;
}) {
  const { t, lang } = useI18n();
  const licenses = [...new Set(photos.map((p) => p.photo.license).filter(Boolean))];
  return (
    <figure className="about-photos about-reveal">
      <div className={photos.length > STRIP_MAX ? "about-grid-photos" : "about-strip"}>
        {photos.map((item, i) => (
          <BookPhoto key={item.photo.id} item={item} onOpen={() => onOpen(photos, i)} />
        ))}
      </div>
      <figcaption>
        {photos.length > 1 ? `${t("site.aboutPhotoCount", { n: photos.length })} · ` : ""}
        <span lang={lang === "en" ? "tr" : undefined}>{licenses.join(" · ")}</span>
      </figcaption>
    </figure>
  );
}

export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Shown[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const shown = photos[index]!;
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const step = (by: number) => onIndex((index + by + photos.length) % photos.length);
  return (
    <dialog
      ref={ref}
      className="about-lightbox"
      aria-label={t("site.photo")}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (photos.length < 2) return;
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
    >
      <button className="about-lightbox-close" aria-label={t("common.close")} onClick={onClose}>
        <X size={20} />
      </button>
      <img src={shown.src} alt={shown.alt} />
      <p>
        {photos.length > 1 ? `${index + 1} / ${photos.length} · ` : ""}
        {shown.caption}
      </p>
      {photos.length > 1 && (
        <>
          <button className="about-lightbox-step prev" aria-label={t("site.prevPhoto")} onClick={() => step(-1)}>
            <ChevronLeft size={22} />
          </button>
          <button className="about-lightbox-step next" aria-label={t("site.nextPhoto")} onClick={() => step(1)}>
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </dialog>
  );
}
