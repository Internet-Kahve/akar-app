"use client";
import { useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import {
  trustLabels,
  type SitePhoto,
  type SiteSource,
  type Trust,
} from "@akar/domain";
import { Modal, Notice, UploadProgress } from "./ui";
import { preparePhoto } from "../lib/editor-media";

const photoLicenses = [
  "Kuruma ait / kullanım izni var",
  "CC BY",
  "CC BY-SA",
  "CC0 / Kamu malı",
  "Kendi çekimim",
];

export function PhotoDialog({
  photos,
  sources,
  initial,
  metadataOnly = false,
  onClose,
  onChoose,
}: {
  photos: SitePhoto[];
  sources: SiteSource[];
  initial?: SitePhoto;
  metadataOnly?: boolean;
  onClose: () => void;
  onChoose: (photo: SitePhoto, source?: SiteSource) => void | Promise<void>;
}) {
  const [creatingSource, setCreatingSource] = useState(
    !metadataOnly && sources.length === 0,
  );
  const [sourceTitle, setSourceTitle] = useState("");
  const [tab, setTab] = useState<"new" | "pool">("new");
  const [photo, setPhoto] = useState<SitePhoto>(
    initial ?? {
      id: crypto.randomUUID(),
      src: "",
      alt: "",
      title: "",
      titleEn: "",
      description: "",
      sourceId: sources[0]?.id ?? "",
      license: "",
      trust: "representative",
    },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function field<K extends keyof SitePhoto>(key: K, value: SitePhoto[K]) {
    setPhoto((p) => ({ ...p, [key]: value }));
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      field("src", await preparePhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={initial ? "Fotoğrafı düzenle" : "Fotoğraf ekle"}
      onClose={onClose}
      wide
    >
      {!metadataOnly && (
        <div className="segmented admin-tabs">
          <button
            className={tab === "new" ? "active" : ""}
            onClick={() => setTab("new")}
          >
            Yeni fotoğraf
          </button>
          <button
            className={tab === "pool" ? "active" : ""}
            onClick={() => setTab("pool")}
          >
            Havuzdan seç ({photos.length})
          </button>
        </div>
      )}
      {tab === "pool" ? (
        <div className="photo-pool">
          {photos.length ? (
            photos.map((p) => (
              <button
                key={p.id}
                className="photo-option"
                onClick={() => {
                  setPhoto(p);
                  setCreatingSource(false);
                  setTab("new");
                }}
              >
                <img src={p.src} alt={p.alt} />
                <strong>{p.title || p.alt || "Adsız fotoğraf"}</strong>
              </button>
            ))
          ) : (
            <Notice>
              Havuz henüz boş. Yeni fotoğraf sekmesinden ilk görseli ekle.
            </Notice>
          )}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (!photo.src) {
              setError("Önce bir fotoğraf seç.");
              return;
            }
            if (creatingSource && !sourceTitle.trim()) {
              setError("Kaynak başlığını yaz.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              if (creatingSource) {
                const source: SiteSource = {
                  id: crypto.randomUUID(),
                  title: sourceTitle.trim(),
                  kind: "field",
                  author: "",
                  year: "",
                  page: "",
                  url: "",
                  trust: "representative",
                };
                await onChoose({ ...photo, sourceId: source.id }, source);
              } else await onChoose(photo);
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Fotoğraf kaydedilemedi.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div
            className="upload-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!metadataOnly) void upload(e.dataTransfer.files[0]);
            }}
          >
            {photo.src ? (
              <img
                className="upload-preview"
                src={photo.src}
                alt={photo.alt || "Yüklenen görselin önizlemesi"}
              />
            ) : (
              <ImagePlus size={32} />
            )}
            {!metadataOnly && (
              <>
                <label className="field">
                  <span>
                    <Upload size={16} /> Fotoğraf dosyası
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(e) => {
                      void upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <small>
                  {busy
                    ? "Fotoğraf hazırlanıyor…"
                    : "Sürükle veya seç · JPG, PNG, WebP · En fazla 5 MB"}
                </small>
              </>
            )}
            {metadataOnly && (
              <Notice>
                Burada fotoğrafın açıklamalarını, lisansını ve güven etiketini
                düzenleyebilirsin. Dosya veya kaynak değişikliği için eserin
                düzenleme ekranını kullan.
              </Notice>
            )}
          </div>
          <label className="field">
            Alt metin (zorunlu)
            <input
              required
              maxLength={300}
              value={photo.alt}
              onChange={(e) => field("alt", e.target.value)}
              placeholder="Görselde ne göründüğünü anlat…"
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Başlık (TR)
              <input
                value={photo.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </label>
            <label className="field">
              Başlık (EN)
              <input
                value={photo.titleEn}
                onChange={(e) => field("titleEn", e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            Fotoğraf açıklaması
            <textarea
              value={photo.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Fotoğraf kaynağı
              <select
                required={!creatingSource}
                disabled={creatingSource || metadataOnly}
                value={photo.sourceId}
                onChange={(e) => field("sourceId", e.target.value)}
              >
                <option value="">Kaynak seç</option>
                {sources.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.title || "Adsız kaynak"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Lisans
              <select
                required
                value={photo.license}
                onChange={(e) => field("license", e.target.value)}
              >
                <option value="">Lisans seç</option>
                {photo.license && !photoLicenses.includes(photo.license) && (
                  <option>{photo.license}</option>
                )}
                {photoLicenses.map((license) => (
                  <option key={license}>{license}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Görsel güven etiketi
            <select
              value={photo.trust}
              onChange={(e) => field("trust", e.target.value as Trust)}
            >
              {Object.entries(trustLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          {!metadataOnly && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCreatingSource(!creatingSource)}
            >
              {creatingSource ? "Mevcut kaynak seç" : "Yeni kaynak ekle"}
            </button>
          )}
          {creatingSource && (
            <label className="field">
              Yeni kaynak başlığı
              <input
                required
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="Fotoğrafçı / arşiv / yayın adı"
              />
              <small>Kaynak, eserin Kaynaklar adımına da eklenecek.</small>
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <UploadProgress />
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              İptal
            </button>
            <button className="btn" disabled={busy}>
              {initial ? "Fotoğrafı güncelle" : "Fotoğrafı ekle"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
