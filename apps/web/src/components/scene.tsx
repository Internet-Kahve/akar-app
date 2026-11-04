"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { sized } from "../lib/image-size";
import {
  ArrowRight,
  ImageIcon,
  Box,
  Move,
  Info,
  Landmark,
  Store,
  Wrench,
  Sun,
  Users,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Expand,
  ImagePlus,
  User,
} from "lucide-react";
import type { CameraPose, HeritageSite, SitePhoto } from "@akar/domain";
import { readPreference, writePreference } from "../lib/preferences";
import { TrustTag } from "./side-sheet";
import { clampCardScale, NO_FRAME, storyCardFrame, storyPartCard } from "../lib/story-scene";
import type { FlowCompanion } from "../lib/flow-companion";
import { Lightbox, useWide, ZoomPhoto, type Shown } from "./about-reading";
import { Cities, useCityIdentity, useCityScene } from "./city-scenes";
import { Localized, useI18n } from "./i18n";
import { PHONE_LAYOUT, useMedia } from "../lib/use-media";
import { Spotlight } from "./coach-tip";
import { ModelStage } from "./model-stage";
import { StoryPhotoCard, type CardPlace } from "./story-photo-card";


/**
 * A sentence's photograph, always whole and fitted over its own blur: it never fills the screen (Muhammed, 3 Nov
 * 2026: the «fill» button and a photograph covering everything are gone).
 */
function StoryPhoto({ photo }: { photo: SitePhoto }) {
  const { text } = useI18n();
  return (
    <section className="story-photo" aria-label={text(photo.title, photo.titleEn) || photo.alt}>
      <img className="story-photo-blur" src={sized(photo.src, 96)} alt="" decoding="async" />
      {/* Two fingers zoom the story's photograph too (3 Nov 2026). */}
      <ZoomPhoto className="story-photo-main" src={sized(photo.src, 1200)!} alt={photo.alt} doubleTap={false} />
      <div className="story-photo-foot">
        <TrustTag trust={photo.trust} quote={text(photo.title, photo.titleEn) || photo.alt} />
        {(photo.title || photo.license) && (
          <p className="story-photo-credit">
            {photo.title && <Localized tr={photo.title} en={photo.titleEn} />}
            {photo.title && photo.license && " · "}
            {photo.license}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Asked once on a phone, the first time a site with a model opens (Muhammed, 3 Nov 2026): photographs (fast) or the
 * 3D model. Meanwhile the photographs show, so nothing heavy loads before the answer; the answer is kept.
 */
function ViewChoice({ onPick }: { onPick: (mode: "photo" | "model") => void }) {
  const { t } = useI18n();
  // Not at once (Muhammed, 3 Nov 2026: «direkt buton çıkmasın»): the page shows first, then the question comes in;
  // its two answers follow one after the other, each with a small moving picture of what it opens.
  return (
    <div className="view-choice" role="group" aria-label={t("view.ask")}>
      {/* An arrow under the two buttons at the top the question speaks of; the screen stays as it is (4 Nov 2026). */}
      <Spotlight clear holes=".view-choice, .galeri-arac .scene-media-switch" arrowTo=".galeri-arac .scene-media-switch" />
      <p className="vc-title">{t("view.ask")}</p>
      <p className="vc-sub">{t("view.askSub")}</p>
      <div className="vc-options">
        <button className="vc-photo" onClick={() => onPick("photo")}>
          <span className="vc-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <b>{t("view.photos")}</b>
          <small>{t("view.photosHint")}</small>
        </button>
        <span className="vc-or" aria-hidden="true">{t("view.or")}</span>
        <button className="vc-model" onClick={() => onPick("model")}>
          <span className="vc-art" aria-hidden="true">
            <Box size={30} strokeWidth={1.6} />
          </span>
          <b>{t("view.model")}</b>
          <small>{t("view.modelHint")}</small>
        </button>
      </div>
    </div>
  );
}

/** Where the switch's selected pill stood last: a switch drawn anew (photo ↔ model) slides it from there. */
let lastMediaIndex = 0;

/**
 * «Fotoğraf | 3D» (prototype `.secici`), always in this order. The selected pill slides to the other side: the
 * switch is drawn again for the other view, so it starts where the last one left it and moves on.
 */
function MediaSwitch({
  value,
  onPhoto,
  onModel,
  dark = false,
}: {
  value: "photo" | "model";
  /** Absent when the site has no photograph: the switch then shows 3D alone. */
  onPhoto?: () => void;
  onModel: () => void;
  dark?: boolean;
}) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const index = value === "photo" || !onPhoto ? 0 : 1;
  const [shown, setShown] = useState(lastMediaIndex);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(index));
    lastMediaIndex = index;
    return () => cancelAnimationFrame(frame);
  }, [index]);
  useEffect(() => {
    const button = box.current?.children[Math.min(shown, (box.current?.children.length ?? 1) - 1)] as HTMLElement | undefined;
    if (button) setPill({ x: button.offsetLeft, w: button.offsetWidth });
  }, [shown]);
  const buttons = [
    ...(onPhoto ? [{ key: "photo" as const, icon: <ImageIcon size={16} />, label: t("site.photo"), go: onPhoto }] : []),
    { key: "model" as const, icon: <Box size={16} />, label: t("site.model3dShort"), go: onModel },
  ];
  return (
    <div
      ref={box}
      className={`scene-media-switch kayan${dark ? " on-photo" : ""}`}
      role="group"
      onClick={() => value === "photo" ? onModel() : onPhoto?.()}
      aria-label={t("site.viewSwitch")}
      style={pill ? ({ "--pill-x": `${pill.x}px`, "--pill-w": `${pill.w}px` } as React.CSSProperties) : undefined}
    >
      {buttons.map((b) => (
        <button
          key={b.key}
          className="btn secondary"
          aria-pressed={value === b.key}
        >
          {b.icon}
          {b.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The site's photographs (prototype `galeriHTML`): two rows across, every third photograph twice as tall; a tap
 * opens it large. On a wide screen a tool row beside the switch counts them, names the inventory and pages across.
 */
/** A visitor's photograph in the site's gallery: its credit and, while it waits, «İnceleniyor». */
export interface VisitorPhoto {
  id: string;
  src: string;
  alt: string;
  author: string;
  /** `pending`: only its sender sees it, under review; `sample`: the team's example. */
  state: "pending" | "approved" | "sample";
}

function PhotoGallery({
  site,
  photos,
  visitors = [],
  onAddPhoto,
  onModel,
}: {
  site: HeritageSite;
  photos: SitePhoto[];
  visitors?: VisitorPhoto[];
  onAddPhoto?: () => void;
  onModel?: () => void;
}) {
  const { t, text } = useI18n();
  const wide = useWide();
  const inventory = useContext(Cities).find((c) => c.name === site.city)?.inventory?.name ?? "";
  const gallery = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const [open, setOpen] = useState<number | null>(null);
  const measure = () => {
    const g = gallery.current;
    if (g) setEdges({ start: g.scrollLeft < 4, end: g.scrollLeft + g.clientWidth > g.scrollWidth - 4 });
  };
  useEffect(measure, [photos, wide]);
  const page = (direction: number) =>
    gallery.current?.scrollBy({
      left: direction * gallery.current.clientWidth * 0.8,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  const shown: Shown[] = [
    ...photos.map((p) => ({
      src: p.src,
      alt: p.alt,
      caption: [p.title ? text(p.title, p.titleEn) : "", site.sources?.find((s) => s.id === p.sourceId)?.title ?? "", p.description, p.license]
        .filter(Boolean)
        .join(" · "),
    })),
    ...visitors.map((v) => ({ src: v.src, alt: v.alt, caption: [t("memoryPage.visitorPhoto"), v.author].join(" · ") })),
  ];
  const stateTag = (v: VisitorPhoto) =>
    v.state === "pending" ? t("memoryPage.reviewing") : v.state === "sample" ? t("site.example") : "";
  return (
    <section className="scene photo-scene galeri-sahne" aria-label={t("site.photosOf", { name: text(site.name, site.nameEn) })}>
      <div className="galeri-arac">
        {onModel && <MediaSwitch value="photo" onPhoto={() => {}} onModel={onModel} />}
        {wide && photos.length > 0 && (
          <>
            <div className="arac-bilgi" aria-live="polite">
              <b>{t("gal.count", { n: photos.length + visitors.length })}</b>
              {visitors.length > 0 && <span>· {t("gal.fromVisitors", { n: visitors.length })}</span>}
              {inventory && <span>· {inventory}</span>}
            </div>
            <div className="arac-oklar">
              <button className="yuvarlak" aria-label={t("gal.prevPage")} disabled={edges.start} onClick={() => page(-1)}>
                <ChevronLeft size={18} />
              </button>
              <button className="yuvarlak" aria-label={t("gal.nextPage")} disabled={edges.end} onClick={() => page(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
      <div
        className="galeri"
        ref={gallery}
        tabIndex={0}
        role="region"
        aria-label={t("site.galleryLabel")}
        onScroll={measure}
      >
        {photos.length === 0 && (
          <p className="photo-gallery-empty" role="status">
            {t("site.noSectionPhoto")}
          </p>
        )}
        {photos.map((photo, index) => (
          <figure key={photo.id} className={index % 3 === 0 ? "buyuk" : "kucuk"}>
            <button className="galeri-f" aria-label={t("gal.enlarge", { alt: photo.alt })} onClick={() => setOpen(index)}>
              <img
                className="scene-photo"
                // A phone's tiles are narrower: smaller files, there sooner.
                src={sized(photo.src, index % 3 === 0 ? (wide ? 560 : 300) : wide ? 360 : 180)}
                alt={photo.alt}
                loading={index < 3 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                decoding="async"
                onLoad={measure}
              />
              <span className="buyut-ic" aria-hidden="true">
                <Expand size={15} />
              </span>
            </button>
            {index === 0 && (
              <span className="galeri-guven">
                <TrustTag
                  trust={photo.trust}
                  quote={photo.title || text(site.name, site.nameEn)}
                  sources={shown[0]!.caption ? [{ title: shown[0]!.caption }] : []}
                />
              </span>
            )}
          </figure>
        ))}
        {visitors.map((v, k) => (
          <figure key={v.id} className={`${(photos.length + k) % 3 === 0 ? "buyuk" : "kucuk"} ziyaretci`}>
            <button className="galeri-f" aria-label={t("gal.enlarge", { alt: v.alt })} onClick={() => setOpen(photos.length + k)}>
              <img src={sized(v.src, 360)} alt={v.alt} loading="lazy" decoding="async" />
              <span className="buyut-ic" aria-hidden="true">
                <Expand size={15} />
              </span>
            </button>
            <figcaption className="zf-kim">
              <User size={13} />
              <b>{v.author}</b>
              {stateTag(v) && <span>{stateTag(v)}</span>}
            </figcaption>
          </figure>
        ))}
        {onAddPhoto && photos.length > 0 && (
          <figure className="kucuk ekle">
            <button className="galeri-ekle" onClick={onAddPhoto}>
              <ImagePlus size={24} />
              {t("gal.addPhoto")}
              <small>{t("gal.addPhotoNote")}</small>
            </button>
          </figure>
        )}
      </div>
      {open !== null && (
        <Lightbox photos={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}

export function Architecture({ kind = "cami" }: { kind?: string }) {
  return (
    <div className={`architecture ${kind}`} aria-hidden="true">
      <div className="arch-ground" />
      <div className="minaret">
        <i />
        <b />
        <span />
      </div>
      <div className="main-building">
        <div className="dome">
          <i />
        </div>
        <div className="building-wall">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="portico">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="side-building">
        <i />
        <span />
        <span />
      </div>
      <div className="tree tree-one" />
      <div className="tree tree-two" />
    </div>
  );
}
/** The story photo card's place and size on this device. */
const CARD_KEY = "akar.hikaye-kart";

export function Scene({
  site,
  flow = false,
  live = false,
  photoId,
  pose,
  interior,
  photoCard,
  highlights,
  turn = true,
  visitors = [],
  onAddPhoto,
  onHotspot,
  onPick,
  context = "detail",
  frameBottom = 0,
  companion,
}: {
  site: HeritageSite;
  /** Height kept free at the bottom (the phone's site card, closed): the model is framed above it. */
  frameBottom?: number;
  /** A sentence about the waqf's income: the other building of the road, shown beside this one. */
  companion?: FlowCompanion;
  /** Visitors' photographs of the site (Yaşayan hafıza): the gallery shows them after the site's own. */
  visitors?: VisitorPhoto[];
  /** «Fotoğrafını ekle», the gallery's last tile: İz Bırak. */
  onAddPhoto?: () => void;
  flow?: boolean;
  live?: boolean;
  photoId?: string;
  /** Story sentence's camera view; the model stays mounted while it changes. */
  pose?: CameraPose;
  /** Story sentence's "İç mekân (3D)": lift the model's cover groups. */
  interior?: boolean;
  /** The story sentence shows its photograph beside the model. */
  photoCard?: boolean;
  /** Story sentence's highlighted parts; a sentence with none is about the whole building and the model turns. */
  highlights?: string[];
  /** The slow turn of the whole building is for the story's first and last sentences only (Muhammed, 2 Nov). */
  turn?: boolean;
  onHotspot: (id: string) => void;
  /** A site task waits for a tap on a model part (pick mode); the model is shown for it. */
  onPick?: (part: string) => void;
  /** What the 3D loading card tells the visitor to do meanwhile: «Dinle ya da Oku» on the detail, nothing more in the story. */
  context?: "detail" | "story";
}) {
  const { t, text } = useI18n();
  const cityScene = useCityScene(site.city);
  const identity = useCityIdentity(site.city);
  const wide = useWide();
  // Where the visitor dragged the photo card and how large they made it: kept through the sentences and, on this
  // device, for the next story (`akar.hikaye-kart`).
  const [cardPlace, setCardPlace] = useState<CardPlace | null>(null);
  const [cardScale, setCardScale] = useState(1);
  useEffect(() => {
    try {
      const saved = JSON.parse(readPreference(CARD_KEY) ?? "null") as { place?: CardPlace | null; scale?: number } | null;
      if (typeof saved?.scale === "number") setCardScale(clampCardScale(saved.scale));
      if (saved?.place && Number.isFinite(saved.place.left) && Number.isFinite(saved.place.top)) setCardPlace(saved.place);
    } catch {}
  }, []);
  // Written only after a change: the first run holds the defaults, before what was saved is read back.
  const cardWritten = useRef(false);
  useEffect(() => {
    if (!cardWritten.current) {
      cardWritten.current = true;
      return;
    }
    writePreference(CARD_KEY, JSON.stringify({ place: cardPlace, scale: cardScale }));
  }, [cardPlace, cardScale]);
  // A model site opens on the model, also in the story (its camera follows the sentences).
  // Photographs or the 3D model, as the visitor chose (kept on the device). A phone that has not chosen yet opens on
  // the photographs (nothing heavy loads) and is asked once (`ask`); the 3D comes only when wanted.
  const phoneLayout = useMedia(PHONE_LAYOUT);
  const [chosen, setChosen] = useState(() => readPreference("akar.gorunum"));
  const [mode, setModeState] = useState<"photo" | "model">(() => {
    if (!site.model) return "photo";
    const kept = readPreference("akar.gorunum");
    if (kept === "photo" || kept === "model") return kept;
    return typeof window !== "undefined" && matchMedia("(max-width: 899.98px)").matches ? "photo" : "model";
  });
  const setMode = (next: "photo" | "model") => {
    // The question has shown where to change this: no hint repeats it.
    if (ask) for (const id of ["d.foto", "masa.foto"]) writePreference(`akar.ipucu.${id}`, "1");
    writePreference("akar.gorunum", next);
    setChosen(next);
    setModeState(next);
  };
  const ask = context === "detail" && phoneLayout && !!site.model && !chosen;
  const photo = [...(site.photos ?? []), ...(site.storyPhotos ?? [])].find(
    (p) => p.id === (photoId || site.coverPhotoId),
  );
  // Story mode follows its sentence's photo; detail mode shows the whole editorial gallery,
  // cover first. Story-only photos do not become public gallery entries.
  const photos = photoId
    ? photo
      ? [photo]
      : []
    : [
        ...new Map(
          [...(photo ? [photo] : []), ...(site.photos ?? [])].map((p) => [
            p.id,
            p,
          ]),
        ).values(),
      ];
  if (
    !flow &&
    (photos.length > 0 || !!photoId) &&
    (!site.model || (mode === "photo" && !onPick))
  )
    return context === "story" && photo ? (
      <>
        <StoryPhoto key={photo.id} photo={photo} />
        {site.model && <MediaSwitch value="photo" onPhoto={() => {}} onModel={() => setMode("model")} dark />}
      </>
    ) : (
      <>
        <PhotoGallery
          key={photoId || site.id}
          site={site}
          photos={photos}
          visitors={visitors}
          onAddPhoto={onAddPhoto}
          onModel={site.model ? () => setMode("model") : undefined}
        />
        {ask && <ViewChoice onPick={setMode} />}
      </>
    );
  // A site with no gallery photograph, not yet answered: the question on the stage's plain ground, no 3D loading.
  // A task waiting for a tap on a part needs the model: no question then.
  if (ask && mode === "photo" && site.model && !flow && !onPick)
    return (
      <div className="scene media-scene detail-scene">
        <ViewChoice onPick={setMode} />
      </div>
    );
  if (site.model && !flow) {
    const card = photoCard && !onPick && mode === "model" ? photo : undefined;
    return (
      <div
        className={`scene media-scene${context === "detail" ? " detail-scene" : ""}`}
      >
        <MediaSwitch
          value={mode}
          onPhoto={photos.length > 0 || !!photoId ? () => setMode("photo") : undefined}
          onModel={() => setMode("model")}
        />
        <>
          <ModelStage
            key={site.model.src}
            model={site.model}
            name={text(site.name, site.nameEn)}
            scene={cityScene}
            identity={identity}
            context={context}
            // The site page opens on the editor's opening angle; a story sentence keeps its own (or the last one).
            pose={pose ?? (context === "detail" ? (site.openingCamera ?? undefined) : undefined)}
            interior={interior}
            // The site page: ← → go through the gallery photographs that have an angle on this model.
            {...(context === "detail" && {
              views: (site.photos ?? []).flatMap((p) =>
                p.camera ? [{ id: p.id, src: p.src, alt: p.alt, title: text(p.title, p.titleEn), camera: p.camera }] : [],
              ),
            })}
            tour={context === "story" && !onPick && !highlights?.length && turn}
            // The sentence's parts breathe in the model (they were never handed to it).
            highlight={context === "story" && !onPick ? highlights : undefined}
            frame={frameBottom ? { left: 0, bottom: frameBottom } : card && !cardPlace ? storyCardFrame(wide, cardScale, typeof window === "undefined" ? 0 : window.innerHeight) : NO_FRAME}
            companion={companion}
            partCards={site.partCards}
            onPick={onPick}
            sources={site.sources}
            siteId={site.id}
            onPhotos={photos.length ? () => setMode("photo") : undefined}
          />
          <div className="model-label">
            <i />
            {t("site.modelLabel")}
            <Info size={13} />
          </div>
          <div className="model-hint">
            <Move size={14} />
            {t("site.modelHint", {
              zoom: wide ? t("site.hintWheel") : t("site.hintTwoFingers"),
            })}
          </div>
          {card && (
            <StoryPhotoCard
              key={card.id}
              photo={card}
              card={storyPartCard(site.partCards ?? [], highlights ?? [])}
              sources={site.sources ?? []}
              place={cardPlace}
              onPlace={setCardPlace}
              scale={cardScale}
              onScale={setCardScale}
              onReset={() => {
                setCardPlace(null);
                setCardScale(1);
              }}
            />
          )}
        </>
      </div>
    );
  }
  if (live)
    return (
      <div className="scene">
        <div className="empty-state">
          <h2>
            <Localized tr={site.name} en={site.nameEn} />
          </h2>
          <p>{t("site.noMedia")}</p>
        </div>
      </div>
    );
  return (
    <div className={`scene ${flow ? "flow-scene" : ""}`}>
      <div className="scene-top">
        <span className="tag">{t("site.sceneTag")}</span>
        <span className="tag representative">
          {t("site.sceneRepresentative")}
        </span>
      </div>
      {flow ? (
        <div className="flow">
          <div className="flow-node">
            <Store size={36} />
            <h3>Bedesten</h3>
            <span>{t("site.flowAkar")}</span>
          </div>
          <div className="flow-connector">
            <span>{t("site.flowIncome")}</span>
            <ArrowRight size={48} />
          </div>
          <div className="flow-node">
            <Landmark size={36} />
            <h3>Ulucami</h3>
            <span>{t("site.flowHayrat")}</span>
          </div>
          <div className="flow-uses">
            <span>
              <Wrench size={18} />
              {t("site.useMaintenance")}
            </span>
            <span>
              <Sun size={18} />
              {t("site.useLighting")}
            </span>
            <span>
              <Users size={18} />
              {t("site.useStaff")}
            </span>
          </div>
          <p>
            {t("site.flowDemo")}
            <br />
            {t("site.flowPending")}
          </p>
        </div>
      ) : (
        <>
          <Architecture kind={site.kind} />
          <button
            className="hotspot dome-spot"
            onClick={() => onHotspot("kubbe")}
          >
            <span>1</span>
            {t("site.hotspotDome")}
          </button>
          <button
            className="hotspot courtyard-spot"
            onClick={() => onHotspot("avlu")}
          >
            <span>2</span>
            {t("site.hotspotCourtyard")}
          </button>
          <button
            className="hotspot bath-spot"
            onClick={() => onHotspot("akar")}
          >
            <span>3</span>
            {t("site.hotspotWaqf")}
          </button>
        </>
      )}
      <div className="scene-bottom">
        <div>
          <small>{t("site.sceneTagline")}</small>
          <h2>
            <Localized tr={site.name} en={site.nameEn} />
          </h2>
        </div>
        <span>
          <Maximize2 size={16} />{" "}
          {flow ? t("site.flowTitle") : t("site.touchExplore")}
        </span>
      </div>
    </div>
  );
}
