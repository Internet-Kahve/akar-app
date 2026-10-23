"use client";
import { useState } from "react";
import { ArrowRight, History } from "lucide-react";
import { trustLabels, type HeritageSite } from "@akar/domain";
import { Back, Notice, Tag } from "./ui";

export function HistoryView({
  site,
  onBack,
  onMemory,
}: {
  site: HeritageSite;
  onBack: () => void;
  onMemory: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const images = site.historyImages ?? [];
  const image = images[selected] ?? images[0];
  const source = site.sources?.find((s) => s.id === image?.sourceId);
  return (
    <main id="main-content" tabIndex={-1} className="history-page">
      <Back onClick={onBack} />
      <div className="row between">
        <div>
          <small className="eyebrow">AYNI YER, BAŞKA BİR ZAMAN</small>
          <h1>Geçmişi Gör</h1>
          <p className="muted">{site.name}</p>
        </div>
        {image && <Tag tone={image.trust}>{trustLabels[image.trust]}</Tag>}
      </div>
      {image ? (
        <>
          <div className="history-grid">
            <figure className="archive-photo">
              <img src={image.photo.src} alt={image.photo.alt} />
              <figcaption>
                {image.dateLabel} · {image.caption}
              </figcaption>
            </figure>
            <aside className="card">
              <History size={28} />
              <h2>{image.caption}</h2>
              <p>{image.dateLabel}</p>
              <p className="archive-credit">
                {image.photo.description || source?.title}
              </p>
              <p className="muted">{image.photo.license}</p>
              {source?.url && /^https?:\/\//.test(source.url) && (
                <a href={source.url} target="_blank" rel="noreferrer">
                  Arşiv kaydını aç ↗
                </a>
              )}
              <Notice>
                Bu fotoğrafın bugünkü eş görüntüsü henüz eklenmedi.
              </Notice>
              <button className="btn secondary full" onClick={onMemory}>
                Bu açıdan fotoğrafın var mı?
                <ArrowRight size={16} />
              </button>
            </aside>
          </div>
          <div
            className="timeline archive-timeline"
            aria-label="Arşiv fotoğrafları"
          >
            {images.map((item, index) => (
              <button
                key={item.id}
                aria-pressed={selected === index}
                className={selected === index ? "active" : ""}
                onClick={() => setSelected(index)}
              >
                <img src={item.photo.src} alt="" loading="lazy" />
                <strong>{item.dateLabel}</strong>
                <small>{item.caption}</small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="card">
          <History size={32} />
          <h2>Bu eserin eski görüntüsü henüz yok</h2>
          <p>Kaynağı bilinen eski fotoğraflar eklendiğinde burada görünecek.</p>
          <button className="btn secondary" onClick={onMemory}>
            Bir fotoğraf paylaş
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
