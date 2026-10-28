"use client";
import { useState } from "react";
import type { MapSettings } from "@akar/domain";
import { Notice } from "./ui";
import { describeError } from "../lib/errors";

/** Same bounds as `PUT /v1/admin/map-settings` (services/api `modules/settings/schemas.ts`). */
const ZOOM = { min: 0, max: 24 };
const MODELS = { min: 0, max: 50 };

function check(zoom: string, models: string): string {
  const z = Number(zoom);
  const m = Number(models);
  if (zoom.trim() === "" || !Number.isFinite(z) || z < ZOOM.min || z > ZOOM.max)
    return `Yakınlaştırma eşiği ${ZOOM.min} ile ${ZOOM.max} arasında olmalı.`;
  if (models.trim() === "" || !Number.isInteger(m) || m < MODELS.min || m > MODELS.max)
    return `Model sayısı ${MODELS.min} ile ${MODELS.max} arasında tam sayı olmalı.`;
  return "";
}

/** Admin only: how many 3D models the visitors' map draws at once and from which zoom (§11.4, §11.36). */
export function AdminMapSettings({
  settings,
  onSave,
  live,
}: {
  settings: MapSettings;
  onSave: (settings: MapSettings) => Promise<MapSettings>;
  live: boolean;
}) {
  const [zoom, setZoom] = useState(String(settings.modelMinZoom));
  const [models, setModels] = useState(String(settings.maxVisibleModels));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const invalid = check(zoom, models);
  const unchanged =
    Number(zoom) === settings.modelMinZoom &&
    Number(models) === settings.maxVisibleModels;
  async function save() {
    if (saving || invalid || unchanged) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await onSave({
        modelMinZoom: Number(zoom),
        maxVisibleModels: Number(models),
      });
      setZoom(String(saved.modelMinZoom));
      setModels(String(saved.maxVisibleModels));
      setMessage("Harita ayarları kaydedildi.");
    } catch (reason) {
      setError(describeError(reason, "Harita ayarları kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="admin-main admin-map-settings">
      <div>
        <small className="eyebrow">HARİTA</small>
        <h1>Harita ayarları</h1>
      </div>
      <p>
        Ziyaretçi haritasında 3B modellerin ne zaman yüklendiğini ve aynı anda
        en çok kaç modelin çizildiğini belirler. Yalnız yöneticiler değiştirir;
        ziyaretçiler yeni değeri bir sonraki açılışta görür.
      </p>
      {!live && (
        <Notice>
          Demo paneli. Değişiklik sayfa yenilendiğinde sıfırlanır.
        </Notice>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label className="field">
          Aynı anda en çok model
          <input
            type="number"
            inputMode="numeric"
            min={MODELS.min}
            max={MODELS.max}
            step={1}
            value={models}
            onChange={(event) => setModels(event.target.value)}
          />
          <small>
            Ekran merkezine en yakın modeller çizilir. 0, haritadaki 3B
            modelleri kapatır.
          </small>
        </label>
        <label className="field">
          Modellerin yüklendiği yakınlaştırma
          <input
            type="number"
            inputMode="decimal"
            min={ZOOM.min}
            max={ZOOM.max}
            step={0.5}
            value={zoom}
            onChange={(event) => setZoom(event.target.value)}
          />
          <small>Harita bu yakınlaştırmadan itibaren model yükler.</small>
        </label>
        {invalid && <p className="error">{invalid}</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <button
          className="btn"
          type="submit"
          disabled={saving || !!invalid || unchanged}
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </section>
  );
}
