"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import {
  trustLabels,
  type AboutChapter,
  type AboutPhoto,
  type HeritageSite,
  type SitePhoto,
} from "@akar/domain";
import { useCityIdentity, useCityScene } from "./city-scenes";
import { ModelStage } from "./model-stage";
import { Modal, Notice, Tag } from "./ui";
import {
  STRIP_MAX,
  chapterBlocks,
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

function useWide() {
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

/** "Eser hakkında": the reading layout for a site with chapters, the plain paragraphs for one without. */
export function AboutModal({
  site,
  onClose,
}: {
  site: HeritageSite;
  onClose: () => void;
}) {
  if (site.chapters?.length)
    return (
      <Modal title="Eser hakkında" className="about-reading" onClose={onClose}>
        <Reading site={site} chapters={site.chapters} />
      </Modal>
    );
  return (
    <Modal title="Eser hakkında" onClose={onClose}>
      <h3>{site.name}</h3>
      <p>{site.description}</p>
      <dl className="facts">
        <div>
          <dt>Dönem</dt>
          <dd>{site.year}</dd>
        </div>
        <div>
          <dt>Mimar</dt>
          <dd>{site.architect}</dd>
        </div>
        <div>
          <dt>Konum</dt>
          <dd>
            {site.city} · {site.district}
          </dd>
        </div>
      </dl>
      {site.sections?.map((section) => (
        <section key={section.id}>
          <h3>{section.title}</h3>
          <p>{section.body}</p>
          <Tag tone={section.trust}>{trustLabels[section.trust]}</Tag>
          <p className="muted">
            {site.sources?.find((source) => source.id === section.sourceId)?.title}
          </p>
        </section>
      ))}
      <h3>Kaynak ve içerik durumu</h3>
      <p>{site.source}</p>
      {!site.sources?.length && (
        <Notice>Bu kaydın kaynaklı içerik paketi henüz eklenmedi.</Notice>
      )}
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
}: {
  site: HeritageSite;
  chapters: AboutChapter[];
}) {
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
  const meta = [site.year, site.patron ?? site.architect, `${site.city} · ${site.district}`]
    .filter(Boolean)
    .join(" · ");

  const nav = (
    <nav className="about-nav" aria-label="Bölümler">
      <button
        className="about-tab-arrow"
        aria-label="Önceki bölümler"
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
            onClick={() => goTo(i)}
          >
            {chapter.title}
          </button>
        ))}
      </div>
      <button
        className="about-tab-arrow"
        aria-label="Sonraki bölümler"
        onClick={() => tabs.current?.scrollBy({ left: 240, behavior: "smooth" })}
      >
        <ChevronRight size={18} />
      </button>
      <i className="about-progress" ref={progress} aria-hidden="true" />
    </nav>
  );

  return (
    <div className="about-scroll" ref={scroller}>
      <header className="about-cover">
        {cover && (
          <div className="about-cover-photo">
            <img src={cover.src} alt={cover.alt} />
          </div>
        )}
        <div className="about-cover-panel">
          {site.district && <span className="about-district">{site.district}</span>}
          <h3 className="about-title">{site.name}</h3>
          <span className="about-gold" aria-hidden="true" />
          <p className="about-meta-top">{meta}</p>
          <p className="about-cover-meta">
            Eser hakkında · {readingMinutes(totalWords)} dk okuma · {chapters.length} bölüm
          </p>
        </div>
      </header>
      <div className={`about-grid${showModel || (wide && sidePhoto) ? " with-aside" : ""}`}>
        <article className="about-main">
          {nav}
          {site.description && <p className="about-lead">{site.description}</p>}
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
              onPhotos={(photos, index) => setLightbox({ photos: photos.map(toShown), index })}
              onTerm={showTerm}
            />
          ))}
          {loose.length > 0 && (
            <section className="about-chapter">
              {loose.map((section: Section) => (
                <div key={section.id}>
                  <h2 className="about-h2">{section.title}</h2>
                  <p className="about-p">{section.body}</p>
                  <Tag tone={section.trust}>{trustLabels[section.trust]}</Tag>
                </div>
              ))}
            </section>
          )}
          <section className="about-end">
            <h2 className="about-h2">Kaynaklar</h2>
            {usedSources.length > 0 && (
              <ul className="about-sources">
                {usedSources.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            )}
            <p className="about-note">{site.source}</p>
            <p className="about-note">
              Metin, kaynağın kendi metnidir; bölüm başlıkları, «Kitaptan» özetleri, rakam kartları ve
              alıntılar okumayı kolaylaştırmak için metinden seçilmiştir, kelimesi değiştirilmemiştir.
            </p>
            {!site.sources?.length && (
              <Notice>Bu kaydın kaynaklı içerik paketi henüz eklenmedi.</Notice>
            )}
          </section>
        </article>
        {wide && (showModel || sidePhoto) && (
          <aside
            className="about-aside"
            aria-label={showModel ? "3B model: okunan bölüm" : "Bölümün fotoğrafı"}
          >
            <div className="about-stage">
              {showModel && site.model ? (
                <ModelStage
                  key={site.model.src}
                  model={site.model}
                  name={site.name}
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
                {pad(active)} · {current.chapter.title}
              </span>
              {showModel && <span className="about-stage-tag">3B model · Temsili</span>}
            </div>
          </aside>
        )}
      </div>
      {term && (
        <div
          className="about-term-card"
          role="note"
          style={{
            left: term.left,
            width: term.width,
            ...(term.top !== undefined ? { top: term.top } : { bottom: term.bottom }),
          }}
        >
          <b>{term.term.word}</b>
          <span>{term.term.definition}</span>
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
  onPhotos: (photos: AboutPhoto[], index: number) => void;
  onTerm: (term: Term, el: HTMLElement) => void;
}) {
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
          <h2 className="about-h2" id={headingId}>
            <span className="about-no">{pad(index)}</span>
            {chapter.title}
          </h2>
          <small>
            {minutes} dk okuma · {count} paragraf
          </small>
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
          <span className="about-label">Kitaptan</span>
          <p>{chapter.summary.join(" ")}</p>
        </div>
      )}
      {chapter.figures.length > 0 && (
        <div className="about-figures">
          {chapter.figures.map((figure) => (
            <div className="about-figure about-reveal" key={`${figure.value}-${figure.label}`}>
              <b>{figure.value}</b>
              <span>{figure.label}</span>
              <small>«{figure.evidence}»</small>
            </div>
          ))}
        </div>
      )}
      {chapter.quotes.map((quote) => (
        <blockquote className="about-quote about-reveal" key={quote.text}>
          <span className="about-gold" aria-hidden="true" />
          <p>{quote.text}</p>
          {quote.by && <cite>{quote.by}</cite>}
        </blockquote>
      ))}
      {chapter.timeline.length > 0 && (
        <ol className="about-timeline">
          {chapter.timeline.map((entry) => (
            <li className="about-reveal" key={`${entry.year}-${entry.evidence}`}>
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
            <span>{open ? "Metni kısalt" : "Derinine in"}</span>
            <small>
              {count} paragraf · {minutes} dk
            </small>
            <ChevronDown size={20} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div>{body}</div>
      )}
      <div className="about-chapter-foot">
        <Tag tone={trust}>{trustLabels[trust]}</Tag>
        {sources.length > 0 && (
          <button
            className="about-sources-toggle"
            aria-expanded={showSources}
            onClick={() => setShowSources(!showSources)}
          >
            Kaynaklar ({sources.length}) {showSources ? "⌄" : "›"}
          </button>
        )}
      </div>
      {showSources && (
        <ul className="about-sources">
          {sources.map((title) => (
            <li key={title}>{title}</li>
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
  // The chapter's first photograph already opens the chapter.
  const photos = block.photos.filter((p) => p !== cover);
  return (
    <>
      {block.kind === "inscription" ? (
        <blockquote className="about-inscription about-reveal">
          <p className="about-inscription-text">{block.original}</p>
          {block.meaning.map((meaning) => (
            <p className="about-inscription-meaning" key={meaning}>
              <span>Mealen:</span> {meaning}
            </p>
          ))}
        </blockquote>
      ) : (
        <p className={`about-p${block.inSummary ? " in-summary" : ""}`}>
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
          <Tag tone={block.trust}>{trustLabels[block.trust]}</Tag>
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
  const [natural, setNatural] = useState<number>();
  const alt = item.alt || item.photo.alt;
  return (
    <button
      className={`about-photo ${className}`.trim()}
      style={{ "--ratio": photoRatio(item.aspect, natural) } as CSSProperties}
      aria-label={`Fotoğrafı büyüt: ${alt}`}
      onClick={onOpen}
    >
      <img
        src={item.photo.src}
        alt={alt}
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
  const licenses = [...new Set(photos.map((p) => p.photo.license).filter(Boolean))];
  return (
    <figure className="about-photos about-reveal">
      <div className={photos.length > STRIP_MAX ? "about-grid-photos" : "about-strip"}>
        {photos.map((item, i) => (
          <BookPhoto key={item.photo.id} item={item} onOpen={() => onOpen(photos, i)} />
        ))}
      </div>
      <figcaption>
        {photos.length > 1 ? `${photos.length} fotoğraf · ` : ""}
        {licenses.join(" · ")}
      </figcaption>
    </figure>
  );
}

function Lightbox({
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
      aria-label="Fotoğraf"
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
      <button className="about-lightbox-close" aria-label="Kapat" onClick={onClose}>
        <X size={20} />
      </button>
      <img src={shown.src} alt={shown.alt} />
      <p>
        {photos.length > 1 ? `${index + 1} / ${photos.length} · ` : ""}
        {shown.caption}
      </p>
      {photos.length > 1 && (
        <>
          <button className="about-lightbox-step prev" aria-label="Önceki fotoğraf" onClick={() => step(-1)}>
            <ChevronLeft size={22} />
          </button>
          <button className="about-lightbox-step next" aria-label="Sonraki fotoğraf" onClick={() => step(1)}>
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </dialog>
  );
}
