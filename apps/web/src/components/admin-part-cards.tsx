"use client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MoveDown,
  MoveUp,
  Plus,
  Trash2,
} from "lucide-react";
import {
  trustLabels,
  type PartCard,
  type SitePhoto,
  type SiteSource,
  type Trust,
} from "@akar/domain";
import { translationLabels } from "../lib/translation-labels";
import { Notice } from "./ui";

function moved<T>(list: T[], index: number, direction: number): T[] {
  const to = index + direction;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to]!, next[index]!];
  return next;
}

/** EN column of a card in the panel: what is written and where it came from, and the voice-overs. */
function englishLabel(c: PartCard) {
  const written = [
    c.titleEn && `başlık ${translationLabels[c.titleEnStatus ?? "reviewed"]}`,
    c.bodyEn && `metin ${translationLabels[c.bodyEnStatus ?? "reviewed"]}`,
  ].filter(Boolean);
  return `EN: ${written.length ? written.join(" · ") : "İngilizce yok"} · ${
    c.narrations?.length ? `ses hazır (${c.narrations.length})` : "ses yok"
  }`;
}

/**
 * "Parça kartları" step of the site editor (§11.41, §11.52): the cards of the 3D model's parts, in order.
 * `modelParts` is undefined while the site has no model; `photos` are the pictures a card may show (the
 * site's photographs and those already on a card).
 */
export function PartCardsStep({
  cards,
  modelParts,
  photos,
  sources,
  onChange,
  job,
  jobsReady,
  note,
  onJob,
}: {
  cards: PartCard[];
  modelParts: string[] | undefined;
  photos: SitePhoto[];
  sources: SiteSource[];
  onChange: (cards: PartCard[]) => void;
  /** The running voice-over or translation request ("narrate:k1"), if any. */
  job: string | null;
  /** The saved cards are what the server holds: no unsaved edit, nothing else running. */
  jobsReady: boolean;
  /** Outcome of the last request. */
  note: { ok: boolean; text: string } | null;
  /** Translate or voice one card (`AkarClient.translateSite` / `narrateSite` with its id). */
  onJob: (kind: "translate" | "narrate", cardId: string) => void;
}) {
  const patch = (id: string, change: Partial<PartCard>) =>
    onChange(cards.map((c) => (c.id === id ? { ...c, ...change } : c)));
  const photoOf = (p: SitePhoto) => photos.find((x) => x.id === p.id) ?? p;
  return (
    <div className="editor-step-content">
      <div className="row between">
        <h2>Parça kartları</h2>
        <button
          className="btn secondary"
          disabled={!modelParts}
          onClick={() =>
            onChange([
              ...cards,
              {
                id: crypto.randomUUID(),
                parts: [],
                title: "",
                body: "",
                photos: [],
                sourceId: sources[0]?.id,
                trust: "representative",
              },
            ])
          }
        >
          <Plus size={16} />
          Kart ekle
        </button>
      </div>
      <p className="muted">
        Ziyaretçi 3D modelde bir parçaya dokununca o parçanın kartı açılır. Kart
        varsa yalnız kartı olan parçalar tıklanır; kart yoksa her parça adıyla
        açılır.
      </p>
      {!modelParts && (
        <Notice>Parça kartı için önce Model adımında 3D model ekle.</Notice>
      )}
      {modelParts && !cards.length && <Notice>Henüz parça kartı yok.</Notice>}
      {note &&
        (note.ok ? (
          <p className="editor-saved" role="status">
            <Check size={16} />
            {note.text}
          </p>
        ) : (
          <p className="error" role="alert">
            {note.text}
          </p>
        ))}
      {cards.map((card, i) => {
        const strip = card.photos;
        const addable = photos.filter((p) => !strip.some((s) => s.id === p.id));
        const partNames = [...new Set([...(modelParts ?? []), ...card.parts])];
        return (
          <fieldset className="cue-editor card" key={card.id}>
            <legend>Kart {i + 1}</legend>
            <div className="cue-top">
              <label className="field">
                Başlık
                <input
                  value={card.title}
                  onChange={(e) => patch(card.id, { title: e.target.value })}
                />
              </label>
              <div className="row">
                <button
                  className="icon-btn"
                  aria-label={`${i + 1}. kartı yukarı taşı`}
                  disabled={i === 0}
                  onClick={() => onChange(moved(cards, i, -1))}
                >
                  <MoveUp size={16} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${i + 1}. kartı aşağı taşı`}
                  disabled={i === cards.length - 1}
                  onClick={() => onChange(moved(cards, i, 1))}
                >
                  <MoveDown size={16} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${i + 1}. kartı kaldır`}
                  onClick={() =>
                    onChange(cards.filter((c) => c.id !== card.id))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <label className="field">
              Metin
              <textarea
                value={card.body}
                onChange={(e) => patch(card.id, { body: e.target.value })}
              />
            </label>
            <div className="story-job-line">
              <small className="muted">{englishLabel(card)}</small>
              <button
                className="btn soft"
                disabled={!jobsReady}
                onClick={() => onJob("translate", card.id)}
              >
                {job === `translate:${card.id}`
                  ? "Çevriliyor…"
                  : "İngilizceye çevir"}
              </button>
              <button
                className="btn soft"
                disabled={!jobsReady}
                onClick={() => onJob("narrate", card.id)}
              >
                {job === `narrate:${card.id}`
                  ? "Seslendiriliyor…"
                  : "Seslendir"}
              </button>
            </div>
            <label className="field">
              Başlık (EN)
              <input
                value={card.titleEn ?? ""}
                onChange={(e) => patch(card.id, { titleEn: e.target.value })}
              />
            </label>
            <label className="field">
              Metin (EN)
              <textarea
                value={card.bodyEn ?? ""}
                onChange={(e) => patch(card.id, { bodyEn: e.target.value })}
              />
            </label>
            <div className="field">
              Kartı açan parçalar
              <div className="part-picks">
                {partNames.map((name) => {
                  const on = card.parts.includes(name);
                  return (
                    <label className="part-pick" key={name}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          patch(card.id, {
                            parts: on
                              ? card.parts.filter((p) => p !== name)
                              : [...card.parts, name],
                          })
                        }
                      />
                      {name}
                      {!modelParts?.includes(name) && " (modelde yok)"}
                    </label>
                  );
                })}
              </div>
              {!card.parts.length && (
                <small className="muted">En az bir parça seç.</small>
              )}
            </div>
            <div className="field">
              Fotoğraflar (ilki kapak)
              <div className="cue-photo part-card-edit-strip">
                {strip.map((p, j) => {
                  const shown = photoOf(p);
                  return (
                    <figure key={p.id}>
                      <img src={shown.src} alt={shown.alt} />
                      <figcaption className="row">
                        {j === 0 && <small>Kapak</small>}
                        <button
                          className="icon-btn"
                          aria-label={`${shown.alt || "Fotoğraf"} sola taşı`}
                          disabled={j === 0}
                          onClick={() =>
                            patch(card.id, { photos: moved(strip, j, -1) })
                          }
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label={`${shown.alt || "Fotoğraf"} sağa taşı`}
                          disabled={j === strip.length - 1}
                          onClick={() =>
                            patch(card.id, { photos: moved(strip, j, 1) })
                          }
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label={`${shown.alt || "Fotoğraf"} karttan çıkar`}
                          onClick={() =>
                            patch(card.id, {
                              photos: strip.filter((x) => x.id !== p.id),
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
              {addable.length > 0 && (
                <select
                  aria-label="Karta fotoğraf ekle"
                  value=""
                  onChange={(e) => {
                    const photo = addable.find((p) => p.id === e.target.value);
                    if (photo) patch(card.id, { photos: [...strip, photo] });
                  }}
                >
                  <option value="">Fotoğraf ekle</option>
                  {addable.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.alt || p.id}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-grid">
              <label className="field">
                Güven etiketi
                <select
                  value={card.trust}
                  onChange={(e) =>
                    patch(card.id, { trust: e.target.value as Trust })
                  }
                >
                  {Object.entries(trustLabels).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Kaynak
                <select
                  value={card.sourceId ?? ""}
                  onChange={(e) =>
                    patch(card.id, { sourceId: e.target.value || undefined })
                  }
                >
                  <option value="">Kaynak yok</option>
                  {sources.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.title || "Adsız kaynak"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
