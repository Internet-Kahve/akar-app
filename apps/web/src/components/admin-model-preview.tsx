"use client";
import { useRef, useState } from "react";
import { Camera, Play, RotateCcw, Trash2, Undo2 } from "lucide-react";
import type { CameraPose, HeritageSite, StoryBlock } from "@akar/domain";
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
}: {
  site: HeritageSite;
  /** The sentence being edited (Hikâye step); absent on the Model step. */
  story?: StoryBlock | undefined;
  storyIndex?: number;
  onOpening?: (pose: CameraPose | null) => void;
  onStoryCamera?: (pose: CameraPose | null) => void;
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
  return (
    <div className="admin-model-preview">
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
      {story && onStoryCamera ? (
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
