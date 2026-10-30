"use client";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Landmark,
  Store,
  Wrench,
  Sun,
  Users,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CameraPose, HeritageSite, SitePhoto } from "@akar/domain";
import { NO_FRAME, storyCardFrame, storyPartCard } from "../lib/story-scene";
import { useWide } from "./about-reading";
import { useCityIdentity, useCityScene } from "./city-scenes";
import { ModelStage } from "./model-stage";
import { StoryPhotoCard, type CardPlace } from "./story-photo-card";

/** Desktop scrolls down the gallery; mobile swipes across it without trapping page scrolling. */
function PhotoGallery({
  site,
  photos,
  onModel,
}: {
  site: HeritageSite;
  photos: SitePhoto[];
  onModel?: () => void;
}) {
  const gallery = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  function goTo(index: number) {
    const strip = gallery.current;
    const item = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !item) return;
    strip.scrollTo({
      left: item.offsetLeft,
      top: item.offsetTop,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section
      className="scene photo-scene"
      aria-label={`${site.name} fotoğrafları`}
    >
      <div className="photo-gallery-toolbar">
        {onModel && (
          <div
            className="scene-media-switch"
            role="group"
            aria-label="Eser görünümü"
          >
            <button
              className="btn secondary"
              aria-pressed={false}
              onClick={onModel}
            >
              3B model
            </button>
            <button className="btn secondary" aria-pressed={true}>
              Fotoğraf
            </button>
          </div>
        )}
        {photos.length > 0 && (
          <div
            className="photo-gallery-navigation"
            role="group"
            aria-label="Fotoğraf gezinme"
          >
            <button
              className="icon-btn"
              aria-label="Önceki fotoğraf"
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <span role="status" aria-live="polite">
              Fotoğraf {active + 1} / {photos.length}
            </span>
            <button
              className="icon-btn"
              aria-label="Sonraki fotoğraf"
              disabled={active === photos.length - 1}
              onClick={() => goTo(active + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
      <div
        className="photo-gallery"
        ref={gallery}
        tabIndex={0}
        role="region"
        aria-label="Eser fotoğraf galerisi"
        onScroll={() => {
          const strip = gallery.current;
          if (!strip) return;
          const horizontal = strip.scrollWidth > strip.clientWidth + 1;
          const position = horizontal ? strip.scrollLeft : strip.scrollTop;
          let closest = 0;
          let distance = Infinity;
          Array.from(strip.children).forEach((child, index) => {
            const item = child as HTMLElement;
            const delta = Math.abs(
              (horizontal ? item.offsetLeft : item.offsetTop) - position,
            );
            if (delta < distance) {
              distance = delta;
              closest = index;
            }
          });
          setActive(closest);
        }}
      >
        {photos.length === 0 && (
          <p className="photo-gallery-empty" role="status">
            Bu bölümün fotoğrafı bulunamadı.
          </p>
        )}
        {photos.map((photo, index) => {
          const source = site.sources?.find(
            (entry) => entry.id === photo.sourceId,
          );
          return (
            <figure
              key={photo.id}
              className="photo-gallery-item"
              aria-label={`${index + 1} / ${photos.length}`}
            >
              <img
                className="scene-photo"
                src={photo.src}
                alt={photo.alt}
                loading={index === 0 ? "eager" : "lazy"}
              />
              <figcaption className="scene-photo-credit">
                <strong>{photo.title || site.name}</strong>
                {photo.license && <span>{photo.license}</span>}
                {source?.title && <span>{source.title}</span>}
              </figcaption>
            </figure>
          );
        })}
      </div>
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
export function Scene({
  site,
  flow = false,
  live = false,
  photoId,
  pose,
  interior,
  photoCard,
  highlights,
  onHotspot,
  onPick,
  context = "detail",
}: {
  site: HeritageSite;
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
  onHotspot: (id: string) => void;
  /** A site task waits for a tap on a model part (pick mode); the model is shown for it. */
  onPick?: (part: string) => void;
  /** What the 3D loading card tells the visitor to do meanwhile: «Dinle ya da Oku» on the detail, nothing more in the story. */
  context?: "detail" | "story";
}) {
  const cityScene = useCityScene(site.city);
  const identity = useCityIdentity(site.city);
  const wide = useWide();
  // Where the visitor dragged the photo card; it stays there through the sentences.
  const [cardPlace, setCardPlace] = useState<CardPlace | null>(null);
  // A model site opens on the model, also in the story (its camera follows the sentences).
  const [mode, setMode] = useState<"photo" | "model">(
    photoId && !site.model ? "photo" : "model",
  );
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
    return (
      <PhotoGallery
        key={photoId || site.id}
        site={site}
        photos={photos}
        onModel={site.model ? () => setMode("model") : undefined}
      />
    );
  if (site.model && !flow) {
    const card = photoCard && !onPick && mode === "model" ? photo : undefined;
    return (
      <div className="scene media-scene">
        <div
          className="scene-media-switch"
          role="group"
          aria-label="Eser görünümü"
        >
          <button
            className="btn secondary"
            aria-pressed={mode === "model"}
            onClick={() => setMode("model")}
          >
            3B model
          </button>
          {(photos.length > 0 || !!photoId) && (
            <button
              className="btn secondary"
              aria-pressed={mode === "photo"}
              onClick={() => setMode("photo")}
            >
              Fotoğraf
            </button>
          )}
        </div>
        <>
          <ModelStage
            key={site.model.src}
            model={site.model}
            name={site.name}
            scene={cityScene}
            identity={identity}
            context={context}
            pose={pose}
            interior={interior}
            tour={context === "story" && !onPick && !highlights?.length}
            frame={card && !cardPlace ? storyCardFrame(wide) : NO_FRAME}
            partCards={site.partCards}
            onPick={onPick}
            sources={site.sources}
          />
          <div className="scene-photo-credit">
            Temsili 3B model · Döndürmek için sürükle, yakınlaştırmak için
            kaydır.
          </div>
          {card && (
            <StoryPhotoCard
              key={card.id}
              photo={card}
              card={storyPartCard(site.partCards ?? [], highlights ?? [])}
              sources={site.sources ?? []}
              place={cardPlace}
              onPlace={setCardPlace}
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
          <h2>{site.name}</h2>
          <p>Bu esere henüz fotoğraf veya 3B model eklenmedi.</p>
        </div>
      </div>
    );
  return (
    <div className={`scene ${flow ? "flow-scene" : ""}`}>
      <div className="scene-top">
        <span className="tag">ETKİLEŞİMLİ KEŞİF</span>
        <span className="tag representative">
          Temsili görünüm · 3D henüz bağlanmadı
        </span>
      </div>
      {flow ? (
        <div className="flow">
          <div className="flow-node">
            <Store size={36} />
            <h3>Bedesten</h3>
            <span>Akar · gelir sağlayan</span>
          </div>
          <div className="flow-connector">
            <span>Vakıf geliri</span>
            <ArrowRight size={48} />
          </div>
          <div className="flow-node">
            <Landmark size={36} />
            <h3>Ulucami</h3>
            <span>Hayrat · hizmet sunan</span>
          </div>
          <div className="flow-uses">
            <span>
              <Wrench size={18} />
              Bakım
            </span>
            <span>
              <Sun size={18} />
              Aydınlatma
            </span>
            <span>
              <Users size={18} />
              Görevliler
            </span>
          </div>
          <p>
            Bedesten → Ulucami demo anlatımıdır.
            <br />
            Bu esere ait gelir ilişkileri kaynak doğrulaması bekliyor.
          </p>
        </div>
      ) : (
        <>
          <Architecture kind={site.kind} />
          <button
            className="hotspot dome-spot"
            onClick={() => onHotspot("kubbe")}
          >
            <span>1</span>Kubbenin hikâyesi
          </button>
          <button
            className="hotspot courtyard-spot"
            onClick={() => onHotspot("avlu")}
          >
            <span>2</span>Avluya yakından bak
          </button>
          <button
            className="hotspot bath-spot"
            onClick={() => onHotspot("akar")}
          >
            <span>3</span>Vakıf nasıl yaşar?
          </button>
        </>
      )}
      <div className="scene-bottom">
        <div>
          <small>BİR YAPI, BİNLERCE HİKÂYE</small>
          <h2>{site.name}</h2>
        </div>
        <span>
          <Maximize2 size={16} />{" "}
          {flow ? "Akar → Hayrat" : "Bir noktaya dokun, keşfet"}
        </span>
      </div>
    </div>
  );
}
