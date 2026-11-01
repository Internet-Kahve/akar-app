"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Eraser, Play, Plus, RotateCcw, Trash2, Undo2 } from "lucide-react";
import type { CameraPose, HeritageSite, PartCard, PhotoCamera, SitePhoto, StoryBlock } from "@akar/domain";
import { sceneOf } from "../lib/scene-light";
import { useCityIdentity, useCityScenes } from "./city-scenes";
import { ModelStage } from "./model-stage";

/** The prototype's distance words (§11.39) against the distance at which the whole model fits. */
const DISTANCES: Array<[number, string]> = [
  [0.42, "yakın"],
  [0.62, "orta"],
  [0.85, "çatı"],
  [0.95, "bütün yapı"],
];
const distanceWord = (d: number) =>
  DISTANCES.reduce((best, x) => (Math.abs(x[0] - d) < Math.abs(best[0] - d) ? x : best))[1];

/** «Merkez · 354° · eğim 30° · bütün yapı»: a pose as the panel lists it. */
export function poseSummary(pose: CameraPose | null | undefined) {
  if (!pose) return "";
  return `${pose.target ?? "Merkez"} · ${Math.round(pose.azimuthDeg)}° · eğim ${Math.round(pose.elevationDeg)}° · ${distanceWord(pose.distance)}`;
}

/** Two poses that the panel would list the same: same part, within a degree and a hundredth of the distance. */
const samePose = (a: CameraPose, b: CameraPose) =>
  a.target === b.target &&
  Math.abs(((a.azimuthDeg - b.azimuthDeg + 540) % 360) - 180) < 1 &&
  Math.abs(a.elevationDeg - b.elevationDeg) < 1 &&
  Math.abs(a.distance - b.distance) < 0.01;

/** The pose a sentence opens on: its own, else the last earlier sentence's, else the site's opening angle. */
export function sentencePose(site: HeritageSite, index: number): CameraPose | undefined {
  for (let i = index; i >= 0; i--) {
    const camera = site.stories[i]?.camera;
    if (camera) return camera;
  }
  return site.openingCamera ?? undefined;
}

/**
 * The panel's 3D preview (Figma «3D önizleme · her adımda sağda»): the draft's model in the visitor's viewer. The
 * editor turns it and saves the view as an angle: the opening angle and the photographs' angles on the Model step. On
 * the Hikâye step the preview is the selected sentence's view and whatever the editor does in it belongs to that
 * sentence: letting go of the model saves the angle, a tap on a part adds it to (or takes it from) the highlights,
 * «İçini göster» makes it an inside sentence. No separate checkboxes: what is shown is what the visitor will see.
 */
export function AdminModelPreview({
  site,
  story,
  storyIndex = 0,
  onOpening,
  onStory,
  onPhotoCamera,
  card,
  cardIndex = 0,
  onCardParts,
  onNewCard,
}: {
  site: HeritageSite;
  /** The sentence being edited (Hikâye step); absent on the Model step. */
  story?: StoryBlock | undefined;
  storyIndex?: number;
  onOpening?: (pose: CameraPose | null) => void;
  /** Hikâye step: a change to the selected sentence's view (camera, highlights, interior). */
  onStory?: (patch: Pick<StoryBlock, "camera" | "highlights" | "interior" | "showCard">) => void;
  /** Model step: a gallery photograph's angle (the visitor's ← → arrows in the 3D view); null removes it. */
  onPhotoCamera?: (photoId: string, camera: PhotoCamera | null) => void;
  /** Parça kartları step: the selected card (absent = none yet), its number and what saving its parts does. */
  card?: PartCard | undefined;
  cardIndex?: number;
  onCardParts?: (parts: string[]) => void;
  /** Parça kartları step: a new card that opens on the parts picked in the preview. */
  onNewCard?: (parts: string[]) => void;
}) {
  const scenes = useCityScenes();
  const identity = useCityIdentity(site.city);
  const reader = useRef<(() => CameraPose) | null>(null);
  // A new object each time: the viewer turns to a pose it has not been given yet.
  const [shown, setShown] = useState<{ pose?: CameraPose; highlight?: string[]; interior?: boolean }>(() => ({
    ...(site.openingCamera && { pose: { ...site.openingCamera } }),
  }));
  const [note, setNote] = useState("");
  // The value before the last save or delete here: «Geri al» puts it back.
  const [undo, setUndo] = useState<(() => void) | null>(null);
  // Model step: the opening angle, or the photographs' angles with the chosen one laid over the model.
  const [tab, setTab] = useState<"opening" | "photos">("opening");
  const photos = site.photos ?? [];
  const [photoId, setPhotoId] = useState(photos[0]?.id ?? "");
  const [overlay, setOverlay] = useState(50);
  const [inside, setInside] = useState(false);
  const photo: SitePhoto | undefined = photos.find((p) => p.id === photoId);
  const choosePhoto = (next: SitePhoto) => {
    setPhotoId(next.id);
    setInside(next.camera?.interior ?? false);
    setNote("");
    setUndo(null);
    if (next.camera) setShown({ pose: { ...next.camera }, interior: next.camera.interior ?? false });
  };
  // Hikâye: what the preview shows for the selected sentence until it is saved (parts tapped, «İçini göster»).
  const [work, setWork] = useState<{ highlights: string[]; interior: boolean; moved: boolean }>({
    highlights: [],
    interior: false,
    moved: false,
  });
  // Parça kartları: the parts picked in the preview, one at a time or (multiple) added and taken off by taps.
  const [picked, setPicked] = useState<string[]>([]);
  const [multiple, setMultiple] = useState(false);
  const cardId = card?.id;
  useEffect(() => {
    setPicked(card?.parts ?? []);
    setNote("");
    setUndo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);
  // Another sentence: the preview goes to its saved view (its own angle, else the last earlier one).
  const storyId = story?.id;
  useEffect(() => {
    if (!storyId) return;
    const pose = sentencePose(site, storyIndex);
    setShown(pose ? { pose: { ...pose } } : {});
    setWork({ highlights: story?.highlights ?? [], interior: story?.interior ?? false, moved: false });
    setNote("");
    setUndo(null);
    // Only on a change of sentence: the sentence's own edits must not send the camera back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);
  const model = site.model;
  if (!model) return null;
  /** Applies a change to the sentence with «Geri al» back to what it was. */
  const changeStory = (patch: Pick<StoryBlock, "camera" | "highlights" | "interior" | "showCard">, message: string) => {
    if (!story || !onStory) return;
    const before = { camera: story.camera, highlights: story.highlights, interior: story.interior };
    onStory(patch);
    setNote(message);
    setUndo(() => () => {
      onStory(before);
      if (before.camera) setShown({ pose: { ...before.camera } });
      setNote("Geri alındı.");
      setUndo(null);
    });
  };
  const sentence = story && onStory;
  const cardMode = Boolean(onNewCard);
  const cardLabel = card ? `Kart ${cardIndex + 1}${card.title ? ` · ${card.title}` : ""}` : "";
  const label = `Cümle ${storyIndex + 1}`;
  const read = () => {
    const pose = reader.current?.();
    if (!pose) {
      setNote("Model yükleniyor; birazdan yeniden dene.");
      return null;
    }
    return pose;
  };
  const change = (
    apply: (pose: CameraPose | null) => void,
    before: CameraPose | null | undefined,
    next: CameraPose | null,
    message: string,
  ) => {
    apply(next);
    setNote(message);
    setUndo(() => () => {
      apply(before ?? null);
      setNote("Geri alındı.");
      setUndo(null);
    });
  };
  const save = (apply: (pose: CameraPose | null) => void, before: CameraPose | null | undefined, label: string) => {
    const pose = read();
    if (pose) change(apply, before, pose, `${label}: ${poseSummary(pose)}`);
  };
  const own = story?.camera;
  const photoMode = !story && onPhotoCamera && tab === "photos";
  return (
    <div className="admin-model-preview">
      {!story && onPhotoCamera && (
        <div className="segmented" role="group" aria-label="Açı türü">
          <button className={tab === "opening" ? "active" : ""} aria-pressed={tab === "opening"} onClick={() => setTab("opening")}>
            Açılış açısı
          </button>
          <button className={tab === "photos" ? "active" : ""} aria-pressed={tab === "photos"} onClick={() => setTab("photos")}>
            Fotoğraf açıları · {photos.filter((p) => p.camera).length}/{photos.length}
          </button>
        </div>
      )}
      <div className="admin-model-stage">
      <ModelStage
        model={model}
        name={site.name}
        scene={sceneOf(site, scenes)}
        identity={identity}
        context="detail"
        poseReader={reader}
        {...(shown.pose && { pose: shown.pose })}
        {...(sentence
          ? {
              highlight: work.highlights,
              interior: work.interior,
              onPoseChange: (camera: CameraPose) => {
                // A tap on a part also ends a gesture: only a camera that really moved counts as a new angle.
                const was = story.camera ?? sentencePose(site, storyIndex);
                if (!was || !samePose(was, camera)) setWork((w) => ({ ...w, moved: true }));
              },
              onInsideChange: (open: boolean) => setWork((w) => ({ ...w, interior: open })),
              onPick: (part: string) =>
                setWork((w) => ({
                  ...w,
                  highlights: w.highlights.includes(part) ? w.highlights.filter((p) => p !== part) : [...w.highlights, part],
                })),
            }
          : cardMode
            ? {
                highlight: picked,
                onPick: (part: string) =>
                  setPicked((now) =>
                    multiple
                      ? now.includes(part)
                        ? now.filter((p) => p !== part)
                        : [...now, part]
                      : now.length === 1 && now[0] === part
                        ? []
                        : [part],
                  ),
              }
            : {
                ...(shown.highlight && { highlight: shown.highlight }),
                ...(shown.interior !== undefined && { interior: shown.interior }),
              })}
      />
      {photoMode && photo && overlay > 0 && (
        // The photograph over the model: turn the model until the two line up, then save.
        <img className="admin-photo-overlay" src={photo.src} alt="" style={{ opacity: overlay / 100 }} />
      )}
      </div>
      {cardMode ? (
        <>
          <div className="admin-model-actions">
            {card && onCardParts && (
              <button
                className="btn"
                disabled={!picked.length}
                onClick={() => {
                  const before = card.parts;
                  onCardParts(picked);
                  setNote(`${cardLabel}: ${picked.join(", ")}`);
                  setUndo(() => () => {
                    onCardParts(before);
                    setPicked(before);
                    setNote("Geri alındı.");
                    setUndo(null);
                  });
                }}
              >
                <Camera size={16} />
                Parçaları kaydet → Kart {cardIndex + 1}
              </button>
            )}
            <button
              className={card ? "btn secondary" : "btn"}
              disabled={!picked.length}
              onClick={() => onNewCard?.(picked)}
            >
              <Plus size={16} />
              Bu parçalarla yeni kart
            </button>
            <label className="check-row admin-card-toggle">
              <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} />
              Çoklu seçim
            </label>
            {picked.length > 0 && (
              <button className="btn secondary" onClick={() => setPicked([])}>
                <Eraser size={16} />
                Seçimi temizle
              </button>
            )}
          </div>
          {card && picked.join() !== card.parts.join() && (
            <p className="admin-unsaved" role="status">
              Seçim kaydedilmedi: «Parçaları kaydet» ile Kart {cardIndex + 1}'e yaz ya da yeni kart aç.
            </p>
          )}
          <p className="muted admin-model-hint">
            Modelde parçaya dokun: {multiple ? "her dokunuş ekler ya da çıkarır" : "dokunduğun parça seçilir («Çoklu seçim» ile birden çok)"}.
            Sonra soldaki kartta başlık, metin ve fotoğrafları doldur.
          </p>
          <dl className="admin-sentence-view">
            <dt>Seçili</dt>
            <dd>{picked.length ? picked.join(", ") : "yok"}</dd>
            {card && (
              <>
                <dt>{`Kart ${cardIndex + 1}`}</dt>
                <dd>{card.parts.length ? card.parts.join(", ") : "parçası yok"}</dd>
              </>
            )}
          </dl>
        </>
      ) : photoMode ? (
        <>
          <div className="admin-photo-strip" role="listbox" aria-label="Galeri fotoğrafları">
            {photos.map((p, i) => (
              <button
                key={p.id}
                role="option"
                aria-selected={p.id === photoId}
                className={p.id === photoId ? "active" : ""}
                title={p.title || p.alt}
                onClick={() => choosePhoto(p)}
              >
                <img src={p.src} alt={p.alt} />
                <span>{p.camera ? "✓" : i + 1}</span>
              </button>
            ))}
          </div>
          {photo && (
            <>
              <label className="field">
                Fotoğrafın görünürlüğü · %{overlay}
                <input type="range" min={0} max={100} value={overlay} onChange={(e) => setOverlay(Number(e.target.value))} />
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={inside}
                  onChange={(e) => {
                    setInside(e.target.checked);
                    setShown((s) => ({ ...s, interior: e.target.checked }));
                  }}
                />
                İçeriden çekilmiş: bu açıda model açılır («İçini göster»)
              </label>
              <div className="admin-model-actions">
                <button
                  className="btn"
                  onClick={() => {
                    const pose = read();
                    if (!pose) return;
                    const camera: PhotoCamera = { ...pose, ...(inside && { interior: true }) };
                    change((c) => onPhotoCamera(photo.id, c as PhotoCamera | null), photo.camera, camera, `${photo.title || "Fotoğraf"}: ${poseSummary(camera)}`);
                  }}
                >
                  <Camera size={16} />
                  Açıyı kaydet → bu fotoğraf
                </button>
                {photo.camera && (
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => setShown({ pose: { ...photo.camera! }, interior: photo.camera!.interior ?? false })}
                    >
                      <RotateCcw size={16} />
                      Açısına git
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => change((c) => onPhotoCamera(photo.id, c as PhotoCamera | null), photo.camera, null, "Fotoğrafın açısı silindi.")}
                    >
                      <Trash2 size={16} />
                      Sil
                    </button>
                  </>
                )}
              </div>
              <small className="muted">
                {photo.camera
                  ? `Ziyaretçi 3D'de oklarla bu fotoğrafa gelince kamera buraya döner: ${poseSummary(photo.camera)}${photo.camera.interior ? " · içeriden" : ""}`
                  : "Bu fotoğrafın açısı yok: ziyaretçinin oklarında görünmez."}
              </small>
            </>
          )}
        </>
      ) : sentence ? (
        <>
          <div className="admin-model-actions">
            <button
              className="btn"
              onClick={() => {
                const camera = read();
                if (!camera) return;
                changeStory(
                  { camera, highlights: work.highlights, interior: work.interior || undefined },
                  `${label} kaydedildi: ${poseSummary(camera)}${work.highlights.length ? ` · vurgu: ${work.highlights.join(", ")}` : ""}${work.interior ? " · iç mekân" : ""}`,
                );
                setWork((w) => ({ ...w, moved: false }));
              }}
            >
              <Camera size={16} />
              Açıyı ve vurguyu kaydet → {label}
            </button>
            <label className="check-row admin-card-toggle">
              <input
                type="checkbox"
                checked={story.showCard ?? false}
                onChange={(e) => onStory({ showCard: e.target.checked })}
              />
              Kart göster
            </label>
            <button
              className="btn secondary"
              onClick={() => {
                const pose = sentencePose(site, storyIndex);
                setShown(pose ? { pose: { ...pose } } : {});
                setWork({ highlights: story.highlights ?? [], interior: story.interior ?? false, moved: false });
              }}
            >
              <Play size={16} />
              Cümleyi oynat
            </button>
            {(story.camera || story.highlights?.length || story.interior) && (
              <button
                className="btn secondary"
                onClick={() => {
                  changeStory({ camera: undefined, highlights: [], interior: undefined }, `${label} sıfırlandı: açı öncekinde kalır, vurgu yok.`);
                  setWork({ highlights: [], interior: false, moved: false });
                }}
              >
                <Eraser size={16} />
                Sıfırla
              </button>
            )}
          </div>
          {(work.moved ||
            work.interior !== (story.interior ?? false) ||
            work.highlights.join() !== (story.highlights ?? []).join()) && (
            <p className="admin-unsaved" role="status">
              Önizlemede kaydedilmemiş değişiklik var: «Açıyı ve vurguyu kaydet» ile {label}'e yaz.
            </p>
          )}
          <p className="muted admin-model-hint">
            {label} seçili. Modeli döndür, vurgulanacak parçalara dokun (tekrar dokununca çıkar), gerekiyorsa «İçini
            göster»; sonra kaydet.
          </p>
          <dl className="admin-sentence-view">
            <dt>Açı</dt>
            <dd>
              {story.camera
                ? poseSummary(story.camera)
                : sentencePose(site, storyIndex)
                  ? `kendi açısı yok, öncekinde kalır (${poseSummary(sentencePose(site, storyIndex))})`
                  : "kendi açısı yok, model varsayılan açıda açılır"}
            </dd>
            <dt>Vurgu</dt>
            <dd>{story.highlights?.length ? story.highlights.join(", ") : "yok (model yavaşça döner)"}</dd>
            <dt>İç mekân</dt>
            <dd>{story.interior ? "açık («İçini göster»)" : "kapalı"}</dd>
          </dl>
        </>
      ) : (
        onOpening && (
          <>
            <div className="admin-model-actions">
              <button className="btn" onClick={() => save(onOpening, site.openingCamera, "Açılış açısı")}>
                <Camera size={16} />
                Açılış açısı olarak kaydet
              </button>
              {site.openingCamera && (
                <>
                  <button className="btn secondary" onClick={() => setShown({ pose: { ...site.openingCamera! } })}>
                    <RotateCcw size={16} />
                    Açılış açısına git
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => change(onOpening, site.openingCamera, null, "Açılış açısı silindi.")}
                  >
                    <Trash2 size={16} />
                    Sil
                  </button>
                </>
              )}
            </div>
            <small className="muted">
              {site.openingCamera
                ? `Eser sayfasındaki 3D bu açıyla açılır: ${poseSummary(site.openingCamera)}`
                : "Açılış açısı yok: eser sayfasındaki 3D varsayılan açıyla açılır."}
            </small>
          </>
        )
      )}
      <p className="muted admin-model-hint">Sürükle: döndür · tekerlek: yakınlaş.</p>
      {note && (
        <div className="admin-model-note" role="status">
          <small>{note}</small>
          {undo && (
            <button className="btn secondary" onClick={undo}>
              <Undo2 size={14} />
              Geri al
            </button>
          )}
        </div>
      )}
    </div>
  );
}
