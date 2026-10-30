import { useState } from "react";
import { trustLabels, type PartCard, type SiteSource } from "@akar/domain";
import { Modal, Tag } from "./ui";

/** A model node name as a visitor reads it ("Tac_Kapi" → "Tac Kapi"). */
export const partLabel = (part: string) => part.replace(/_/g, " ");

/** 3D part card: photo strip (first = cover), text, trust and source. */
export function PartCardDialog({
  card,
  sources,
  onClose,
}: {
  card: PartCard;
  sources: SiteSource[];
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);
  const source = sources.find((s) => s.id === card.sourceId);
  return (
    <Modal title={card.title} onClose={onClose}>
      {card.photos.length > 0 && (
        <div className="part-card-photos">
          <div
            className="part-card-strip"
            onScroll={(e) => {
              const strip = e.currentTarget;
              setShown(Math.round(strip.scrollLeft / (strip.clientWidth || 1)));
            }}
          >
            {card.photos.map((photo) => (
              <figure key={photo.id}>
                <img src={photo.src} alt={photo.alt} />
                <figcaption>
                  {photo.title} · {photo.license}
                </figcaption>
              </figure>
            ))}
          </div>
          {card.photos.length > 1 && (
            <span className="part-card-count" aria-hidden="true">
              {shown + 1} / {card.photos.length}
            </span>
          )}
        </div>
      )}
      <p className="part-card-body">{card.body}</p>
      <Tag tone={card.trust}>{trustLabels[card.trust]}</Tag>
      {source && <p className="muted part-card-source">Kaynak: {source.title}</p>}
    </Modal>
  );
}
