"use client";
import { useRef, useState } from "react";
import { Camera, Play, RotateCcw, Trash2, Undo2 } from "lucide-react";
import type { CameraPose, HeritageSite, PhotoCamera, SitePhoto, StoryBlock } from "@akar/domain";
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
 * editor turns it and saves the view as an angle: the opening angle on the Model step, the selected sentence's on the
 * Hikâye step, where «Cümleyi oynat» shows the sentence as the visitor will see it (angle, highlights, interior).
 */
export function AdminModelPreview({
  site,
  story,
  storyIndex = 0,
  onOpening,
  onStoryCamera,
  onPhotoCamera,
}: {
  site: HeritageSite;
  /** The sentence being edited (Hikâye step); absent on the Model step. */
  story?: StoryBlock | undefined;
  storyIndex?: number;
  onOpening?: (pose: CameraPose | null) => void;
  onStoryCamera?: (pose: CameraPose | null) => void;
  /** Model step: a gallery photograph's angle (the visitor's ← → arrows in the 3D view); null removes it. */
  onPhotoCamera?: (photoId: string, camera: PhotoCamera | null) => void;
}) {
  const scenes = useCityScenes();
  const identity = useCityIdentity(site.city);
  const reader = useRef<(() => CameraPose) | null>(null);
  // A new object each time: the viewer turns to a pose it has not been given yet.
  const [shown, setShown] = useState<{ pose?: CameraPose; highlight?: string[]; interior?: boolean }>(() => ({
    ...(site.openingCamera && { pose: { ...site.openingCamera } }),
  }));
  const [target, setTarget] = useState<string>("");
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
  const model = site.model;
  if (!model) return null;
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
  const lookAt = (part: string) => {
    setTarget(part);
    const pose = read();
    if (pose) setShown({ pose: { ...pose, target: part || null } });
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
        {...(shown.highlight && { highlight: shown.highlight })}
        {...(shown.interior !== undefined && { interior: shown.interior })}
      />
      {photoMode && photo && overlay > 0 && (
        // The photograph over the model: turn the model until the two line up, then save.
        <img className="admin-photo-overlay" src={photo.src} alt="" style={{ opacity: overlay / 100 }} />
      )}
      </div>
      <label className="field">
        Bakılan yer
        <select value={target} onChange={(e) => lookAt(e.target.value)}>
          <option value="">Modelin ortası</option>
          {model.parts.map((part) => (
            <option key={part}>{part}</option>
          ))}
        </select>
      </label>
      <p className="muted admin-model-hint">Sürükle: döndür · tekerlek: yakınlaş. Bakılan yeri seçince kamera o parçanın etrafında döner.</p>
      {photoMode ? (
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
      ) : story && onStoryCamera ? (
        <>
          <div className="admin-model-actions">
            <button className="btn" onClick={() => save(onStoryCamera, story.camera, `Cümle ${storyIndex + 1}`)}>
              <Camera size={16} />
              Açıyı kaydet → Cümle {storyIndex + 1}
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                setShown({
                  ...(sentencePose(site, storyIndex) && { pose: { ...sentencePose(site, storyIndex)! } }),
                  highlight: story.highlights ?? [],
                  interior: story.interior ?? false,
                })
              }
            >
              <Play size={16} />
              Cümleyi oynat
            </button>
            {own && (
              <button
                className="btn secondary"
                onClick={() => change(onStoryCamera, own, null, `Cümle ${storyIndex + 1}'in açısı silindi.`)}
              >
                <Trash2 size={16} />
                Açıyı sil
              </button>
            )}
          </div>
          <small className="muted">
            {own
              ? `Cümle ${storyIndex + 1}: ${poseSummary(own)}`
              : `Cümle ${storyIndex + 1}'in kendi açısı yok; ${
                  sentencePose(site, storyIndex) ? `öncekinde kalır (${poseSummary(sentencePose(site, storyIndex))})` : "model varsayılan açıda açılır"
                }.`}
          </small>
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
