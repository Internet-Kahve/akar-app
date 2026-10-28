"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  RotateCw,
} from "lucide-react";
import { placementLimits, type MapPlacement } from "@akar/domain";
import { Notice } from "./ui";
import {
  PlacementMap,
  type PlacementMapHandle,
  type PlacementMapStatus,
  type PlacementMode,
} from "./placement-map";
import { describeFieldError } from "../lib/errors";
import {
  HEADING_STEP,
  NUDGE_M,
  defaultPlacement,
  moveTo,
  normalizeHeading,
  nudge,
  placementKey,
  rotate90,
  toDraft,
  type PlacementDraft,
} from "../lib/placement";
import {
  longestEdgeHeading,
  ringCentroid,
  type Ring,
} from "../lib/osm-buildings";

export interface PlacementEditor {
  phase: "loading" | "ready" | "failed";
  /** What the preview shows: the edited values, or the starting point of a model not placed yet. */
  value: PlacementDraft;
  /** Edited and not saved. */
  dirty: boolean;
  busy: boolean;
  message: string;
  error: string;
  edit(change: (p: PlacementDraft) => PlacementDraft): void;
  /** Back to the last saved values. */
  revert(): void;
  reload(): void;
  /** Saves the whole placement for the site with this id; the error message, or `null` when it was saved. */
  save(siteId: string): Promise<string | null>;
}

/**
 * Editing state of one site's model placement, apart from the site draft: the placement has its own
 * save (`PUT .../map-placement`) and survives saving the site. `persisted` = the server has the site
 * with its model, which a placement needs (409 otherwise).
 */
export function usePlacementEditor({
  siteId,
  initial,
  coordinates,
  persisted,
  load,
  onSave,
}: {
  siteId: string;
  initial: MapPlacement | null | undefined;
  coordinates: [number, number];
  persisted: boolean;
  load: (siteId: string) => Promise<MapPlacement | null>;
  onSave: (siteId: string, placement: MapPlacement) => Promise<void>;
}): PlacementEditor {
  const start = initial ? toDraft(initial) : null;
  const [saved, setSaved] = useState<PlacementDraft | null>(start);
  const [value, setValue] = useState<PlacementDraft | null>(start);
  const [phase, setPhase] = useState<PlacementEditor["phase"]>(
    persisted ? "loading" : "ready",
  );
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  // A read that was started before a save answers with the older values: it must not undo the save.
  const saves = useRef(0);

  // The catalog hides a placement whose `visible` is off: the panel reads the saved one itself.
  useEffect(() => {
    if (!persisted) {
      setPhase("ready");
      return;
    }
    let cancelled = false;
    // A re-read after the site was saved keeps showing the preview.
    setPhase((now) => (now === "ready" ? now : "loading"));
    const savesBefore = saves.current;
    load(siteId).then(
      (found) => {
        if (cancelled) return;
        if (saves.current !== savesBefore) {
          setPhase("ready");
          return;
        }
        const read = found ? toDraft(found) : null;
        const before = savedRef.current;
        setSaved(read);
        // Edits made before the read finished stay; untouched values take the saved ones.
        setValue((v) =>
          v === null || placementKey(v) === placementKey(before) ? read : v,
        );
        setPhase("ready");
      },
      (e) => {
        if (cancelled) return;
        setError(describeFieldError(e, "Kayıtlı yerleşim okunamadı."));
        setPhase("failed");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [persisted, siteId, load, attempt]);

  const dirty = value !== null && placementKey(value) !== placementKey(saved);
  const shown = value ?? defaultPlacement(coordinates);

  async function save(id: string) {
    saves.current++;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await onSave(id, shown);
      setSaved(shown);
      setValue(shown);
      setMessage("Yerleşim kaydedildi.");
      return null;
    } catch (e) {
      const text = describeFieldError(e, "Yerleşim kaydedilemedi.");
      setError(text);
      return text;
    } finally {
      setBusy(false);
    }
  }

  return {
    phase,
    value: shown,
    dirty,
    busy,
    message,
    error,
    edit: (change) => {
      setMessage("");
      setValue((v) => change(v ?? defaultPlacement(coordinates)));
    },
    revert: () => {
      setMessage("");
      setError("");
      setValue(saved);
    },
    reload: () => {
      setError("");
      setAttempt((n) => n + 1);
    },
    save,
  };
}

/** Number input that lets half-typed values ("-", "") through and snaps back on leaving the field. */
function NumberField({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onCommit: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);
  return (
    <label className="field">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={text}
        disabled={disabled}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(String(value));
        }}
        onChange={(e) => {
          setText(e.target.value);
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n) && n >= min && n <= max) onCommit(n);
        }}
      />
    </label>
  );
}

const nudges = [
  { label: "Batıya", icon: ArrowLeft, by: [-NUDGE_M, 0] },
  { label: "Kuzeye", icon: ArrowUp, by: [0, NUDGE_M] },
  { label: "Güneye", icon: ArrowDown, by: [0, -NUDGE_M] },
  { label: "Doğuya", icon: ArrowRight, by: [NUDGE_M, 0] },
] as const;

/**
 * "Haritada göster": the model's place on the visitors' map, edited next to a live preview.
 * Everything here is unsaved until "Yerleşimi kaydet".
 */
export function PlacementSection({
  editor,
  siteId,
  modelSrc,
  parts,
  persisted,
}: {
  editor: PlacementEditor;
  siteId: string;
  modelSrc: string;
  parts: string[];
  /** The server has the site with its model. */
  persisted: boolean;
}) {
  const map = useRef<PlacementMapHandle>(null);
  const [satellite, setSatellite] = useState(false),
    [mode, setMode] = useState<PlacementMode>("none"),
    [selection, setSelection] = useState<{ hidden: boolean } | null>(null),
    [status, setStatus] = useState<PlacementMapStatus>({
      map: "loading",
      model: "loading",
    }),
    [scaleOpen, setScaleOpen] = useState(false),
    [limit, setLimit] = useState("");
  const p = editor.value;
  const { points } = placementLimits;
  const scaleUnlocked = scaleOpen || p.scale !== 1;
  const toggleMode = (next: PlacementMode) => {
    setMode((m) => (m === next ? "none" : next));
  };
  function fit(ring: Ring) {
    const [lng, lat] = ringCentroid(ring);
    editor.edit((v) => ({
      ...moveTo(v, lng, lat),
      headingDeg: normalizeHeading(longestEdgeHeading(ring)),
    }));
    setMode("none");
  }
  function toggleBuilding() {
    if (!selection) return;
    const next = map.current?.setSelectedHidden(!selection.hidden);
    if (!next) return;
    if (next.hiddenPoints.length > points || next.keptPoints.length > points) {
      setLimit(`Her listede en çok ${points} bina tutulur.`);
      return;
    }
    setLimit("");
    editor.edit((v) => ({ ...v, ...next }));
  }
  const anchors =
    p.anchorNode && !parts.includes(p.anchorNode)
      ? [p.anchorNode, ...parts]
      : parts;

  return (
    <section className="placement" aria-labelledby="placement-title">
      <h3 id="placement-title">Haritada göster</h3>
      <p className="muted">
        Modelin keşif haritasındaki yeri, yönü ve yüksekliği. Önizleme
        kaydetmeden değişir; &ldquo;Yerleşimi kaydet&rdquo; ziyaretçilerin
        haritasına yansıtır.
      </p>
      {!persisted && (
        <Notice>
          Yerleşimi kaydetmek için önce eseri taslak olarak kaydet; model
          sunucuya o zaman bağlanır. Aşağıdaki değerleri şimdiden ayarlayabilir,
          kaydettikten sonra yerleşimi de kaydedebilirsin.
        </Notice>
      )}
      {editor.phase === "loading" && (
        <p className="muted" role="status">
          Kayıtlı yerleşim okunuyor…
        </p>
      )}
      {editor.phase === "failed" && (
        <div className="row">
          <p className="error" role="alert">
            {editor.error}
          </p>
          <button className="btn secondary" onClick={editor.reload}>
            Yeniden dene
          </button>
        </div>
      )}
      {editor.phase === "ready" && (
        <>
          <PlacementMap
            ref={map}
            modelSrc={modelSrc}
            placement={p}
            satellite={satellite}
            mode={mode}
            onMove={(lng, lat) => editor.edit((v) => moveTo(v, lng, lat))}
            onFit={fit}
            onSelect={setSelection}
            onNudge={(east, north) => editor.edit((v) => nudge(v, east, north))}
            onStatus={setStatus}
          />
          {status.map === "failed" && (
            <p className="muted" role="status">
              Harita yüklenemedi. Değerleri yine de ayarlayıp kaydedebilirsin.
            </p>
          )}
          {status.map === "ready" && status.model === "loading" && (
            <p className="muted" role="status">
              Model yükleniyor…
            </p>
          )}
          {status.model === "failed" && (
            <p className="error" role="status">
              Model önizlemede açılamadı.
            </p>
          )}
          <div
            className="placement-tools"
            role="group"
            aria-label="Harita araçları"
          >
            <button
              type="button"
              className={`btn ${mode === "fit" ? "" : "secondary"}`}
              aria-pressed={mode === "fit"}
              onClick={() => toggleMode("fit")}
            >
              OSM binasına oturt
            </button>
            <button
              type="button"
              className={`btn ${mode === "buildings" ? "" : "secondary"}`}
              aria-pressed={mode === "buildings"}
              onClick={() => toggleMode("buildings")}
            >
              Binalar
            </button>
            <button
              type="button"
              className={`btn ${satellite ? "" : "secondary"}`}
              aria-pressed={satellite}
              onClick={() => setSatellite((on) => !on)}
            >
              Uydu
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => editor.edit(rotate90)}
            >
              <RotateCw size={16} />
              90° döndür
            </button>
          </div>
          {mode === "fit" && (
            <p className="muted" role="status">
              Haritada modelin oturacağı binaya tıkla. Model binanın ortasına
              oturur, yönü binanın uzun kenarına göre ayarlanır.
            </p>
          )}
          {mode === "buildings" && (
            <div className="placement-buildings">
              <p className="muted">
                Bir binaya tıkla, sonra gizle ya da geri göster. Kırmızı binalar
                haritada çizilmez.
              </p>
              {selection && (
                <div className="row">
                  <span role="status">
                    Seçili bina: {selection.hidden ? "gizli" : "görünür"}
                  </span>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={toggleBuilding}
                  >
                    {selection.hidden ? "Geri göster" : "Gizle"}
                  </button>
                </div>
              )}
              <small className="muted">
                Elle gizlenen: {p.hiddenPoints.length} · geri istenen:{" "}
                {p.keptPoints.length} (her listede en çok {points})
              </small>
              {limit && (
                <p className="error" role="alert">
                  {limit}
                </p>
              )}
            </div>
          )}
          {satellite && (
            <small className="muted">
              Uydu görüntüsü: Esri World Imagery. Model yarı saydam; OSM binası
              yanlış yerdeyse doğru yeri buradan ölçebilirsin.
            </small>
          )}

          <div className="placement-controls">
            <label className="field">
              Yön: {p.headingDeg}°
              <input
                type="range"
                min={0}
                max={359.5}
                step={HEADING_STEP}
                value={p.headingDeg}
                aria-label="Yön (derece)"
                onChange={(e) =>
                  editor.edit((v) => ({
                    ...v,
                    headingDeg: normalizeHeading(Number(e.target.value)),
                  }))
                }
              />
            </label>
            <NumberField
              label="Yükseklik (m)"
              value={p.altitudeM}
              min={placementLimits.altitudeM.min}
              max={placementLimits.altitudeM.max}
              step={0.5}
              onCommit={(altitudeM) =>
                editor.edit((v) => ({ ...v, altitudeM }))
              }
            />
            <label className="field">
              Ana parça
              <select
                value={p.anchorNode ?? ""}
                onChange={(e) =>
                  editor.edit((v) => ({
                    ...v,
                    anchorNode: e.target.value || null,
                  }))
                }
              >
                <option value="">Otomatik (tüm parçalar)</option>
                {anchors.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="placement-nudge"
            role="group"
            aria-label="Konumu 0,5 metre kaydır"
          >
            <span>
              Konum: {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
            </span>
            {nudges.map(({ label, icon: Icon, by }) => (
              <button
                key={label}
                type="button"
                className="btn secondary"
                aria-label={`${label} 0,5 m`}
                onClick={() => editor.edit((v) => nudge(v, by[0], by[1]))}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <details className="editor-details">
            <summary>Gelişmiş</summary>
            <label className="check">
              <input
                type="checkbox"
                checked={scaleUnlocked}
                disabled={p.scale !== 1}
                onChange={(e) => setScaleOpen(e.target.checked)}
              />
              Ölçeği değiştir (model 1 birim = 1 metre ise gerekmez)
            </label>
            <NumberField
              label="Ölçek"
              value={p.scale}
              min={placementLimits.scale.min}
              max={placementLimits.scale.max}
              step={0.05}
              disabled={!scaleUnlocked}
              onCommit={(scale) => editor.edit((v) => ({ ...v, scale }))}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={p.visible}
                onChange={(e) =>
                  editor.edit((v) => ({ ...v, visible: e.target.checked }))
                }
              />
              Ziyaretçilerin haritasında göster
            </label>
            <small className="muted">
              Kapalıyken yerleşim kayıtlı kalır, model haritadan kalkar.
            </small>
          </details>
        </>
      )}

      {editor.error && editor.phase !== "failed" && (
        <p className="error" role="alert">
          {editor.error}
        </p>
      )}
      {editor.message && (
        <p className="editor-saved" role="status">
          <Check size={16} />
          {editor.message}
        </p>
      )}
      {editor.phase === "ready" && (
        <div className="row">
          <button
            type="button"
            className="btn"
            disabled={editor.busy || !persisted}
            onClick={() => void editor.save(siteId)}
          >
            Yerleşimi kaydet
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={editor.busy || !editor.dirty}
            onClick={editor.revert}
          >
            Son kayda dön
          </button>
          {editor.dirty && (
            <small className="muted">Kaydedilmemiş yerleşim</small>
          )}
        </div>
      )}
    </section>
  );
}
