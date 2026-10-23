"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Landmark,
  Store,
  Wrench,
  Sun,
  Users,
  Maximize2,
} from "lucide-react";
import type { HeritageSite } from "@akar/domain";
const ModelViewer = dynamic(() => import("./model-viewer"), {
  ssr: false,
  loading: () => <p role="status">3B görünüm hazırlanıyor…</p>,
});

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
  onHotspot,
}: {
  site: HeritageSite;
  flow?: boolean;
  live?: boolean;
  photoId?: string;
  onHotspot: (id: string) => void;
}) {
  const [mode, setMode] = useState<"photo" | "model">(
    photoId ? "photo" : "model",
  );
  const photo = [...(site.photos ?? []), ...(site.storyPhotos ?? [])].find(
    (p) => p.id === (photoId || site.coverPhotoId),
  );
  if (site.model && !flow)
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
          {photo && (
            <button
              className="btn secondary"
              aria-pressed={mode === "photo"}
              onClick={() => setMode("photo")}
            >
              Fotoğraf
            </button>
          )}
        </div>
        {mode === "model" || !photo ? (
          <>
            <ModelViewer
              key={site.model.src}
              model={site.model}
              name={site.name}
            />
            <div className="scene-photo-credit">
              Temsili 3B model · Döndürmek için sürükle, yakınlaştırmak için
              kaydır.
            </div>
          </>
        ) : (
          <>
            <img className="scene-photo" src={photo.src} alt={photo.alt} />
            <div className="scene-photo-credit">
              {photo.title} · {photo.license}
              <br />
              {site.sources?.find((s) => s.id === photo.sourceId)?.title}
            </div>
          </>
        )}
      </div>
    );
  if (photo && !flow)
    return (
      <div className="scene">
        <img className="scene-photo" src={photo.src} alt={photo.alt} />
        <div className="scene-photo-credit">
          {photo.title || site.name} · {photo.license}
          <br />
          {site.sources?.find((s) => s.id === photo.sourceId)?.title}
        </div>
      </div>
    );
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
