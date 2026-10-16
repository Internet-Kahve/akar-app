"use client";
import { useState } from "react";
import {
  BookOpen,
  MapPin,
  MessageSquare,
  Plus,
  Pencil,
  Check,
  X,
  ArrowRight,
  Shield,
  RotateCcw,
} from "lucide-react";
import type { Command, HeritageSite, Snapshot } from "@akar/domain";
import { Modal, Notice, Tag } from "./ui";
type Commit = (command: Command) => Promise<boolean>;
export function Profile({
  state,
  onSite,
  onAdmin,
  onReset,
}: {
  state: Snapshot;
  onSite: (id: string) => void;
  onAdmin: () => void;
  onReset: () => void;
}) {
  const [contrast, setContrast] = useState(
      () =>
        typeof document !== "undefined" &&
        document.documentElement.dataset.contrast === "high",
    ),
    [large, setLarge] = useState(
      () =>
        typeof document !== "undefined" &&
        document.documentElement.dataset.textSize === "large",
    );
  const badges = [
    { name: "İlk hikâye", earned: state.readIds.length > 0 },
    { name: "İlk adım", earned: state.visitedIds.length > 0 },
    { name: "Meraklı zihin", earned: state.quizIds.length > 0 },
    {
      name: "Hafızaya katkı",
      earned: state.memories.some((m) => m.status === "approved"),
    },
    { name: "Semt gezgini", earned: state.visitedIds.length >= 3 },
    { name: "İz koleksiyoncusu", earned: state.readIds.length >= 5 },
  ];
  return (
    <main id="main-content" tabIndex={-1} className="profile-page">
      <div className="page-intro">
        <small className="eyebrow">SENİN KEŞİF HİKÂYEN</small>
        <h1>Mirasım</h1>
        <p>Gördüğün her yapı, hikâyenin bir parçası.</p>
      </div>
      <div className="profile-grid">
        <aside>
          <div className="profile-card">
            <div className="avatar large">G</div>
            <h2>{state.name}</h2>
            <Tag tone="gold">{state.points} keşif puanı</Tag>
            <p className="muted">Demo profili · Bu tarayıcıya özel</p>
          </div>
          <div className="settings card">
            <h3>Deneyimini özelleştir</h3>
            <label>
              Yüksek kontrast
              <input
                type="checkbox"
                checked={contrast}
                onChange={(e) => {
                  setContrast(e.target.checked);
                  document.documentElement.dataset.contrast = e.target.checked
                    ? "high"
                    : "normal";
                }}
              />
            </label>
            <label>
              Büyük yazı
              <input
                type="checkbox"
                checked={large}
                onChange={(e) => {
                  setLarge(e.target.checked);
                  document.documentElement.dataset.textSize = e.target.checked
                    ? "large"
                    : "normal";
                }}
              />
            </label>
            <button className="text-btn" onClick={onAdmin}>
              <Shield size={16} />
              Demo yönetim paneli
              <ArrowRight size={15} />
            </button>
            <button className="text-btn danger" onClick={onReset}>
              <RotateCcw size={16} />
              Demo verilerini sıfırla
            </button>
          </div>
        </aside>
        <div className="profile-main">
          <div className="stat-grid">
            {[
              {
                icon: BookOpen,
                n: state.readIds.length,
                label: "hikâye keşfedildi",
              },
              {
                icon: MapPin,
                n: state.visitedIds.length,
                label: "demo ziyareti",
              },
              {
                icon: MessageSquare,
                n: state.memories.length,
                label: "iz bırakıldı",
              },
            ].map(({ icon: Icon, n, label }) => (
              <div className="card stat" key={label}>
                <Icon size={21} />
                <strong>{n}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="row between">
              <h3>Keşif rozetlerin</h3>
              <Tag>
                {badges.filter((b) => b.earned).length} / {badges.length}
              </Tag>
            </div>
            <div className="badges">
              {badges.map((b) => (
                <div key={b.name} className={b.earned ? "earned" : ""}>
                  <img
                    src={`/figma/${b.earned ? "718a4" : "b8133"}.svg`}
                    alt=""
                  />
                  <span>{b.name}</span>
                  <small>{b.earned ? "Kazanıldı" : "Kilitli"}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Keşfettiklerim</h3>
            {state.readIds.length === 0 ? (
              <div className="empty-inline">
                <BookOpen size={26} />
                <p>İlk hikâyen seni bekliyor.</p>
                <button
                  className="text-btn"
                  onClick={() => onSite("ulu-cami")}
                >
                  Keşfe başla <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              state.readIds.map((id) => (
                <button
                  className="list-row"
                  key={id}
                  onClick={() => onSite(id)}
                >
                  <span>
                    <strong>
                      {state.sites.find((s) => s.id === id)?.name}
                    </strong>
                    <small>
                      Hikâye tamamlandı{" "}
                      {state.visitedIds.includes(id)
                        ? "· Demo ziyareti yapıldı"
                        : ""}
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))
            )}
          </div>
          <div className="card">
            <h3>Paylaşımlarım</h3>
            {!state.memories.length ? (
              <p className="muted">Henüz bir iz bırakmadın.</p>
            ) : (
              state.memories.map((m) => (
                <div className="memory-row" key={m.id}>
                  <div>
                    <strong>
                      {state.sites.find((s) => s.id === m.siteId)?.name}
                    </strong>
                    <p>{m.text}</p>
                    {m.reason && <small className="error">{m.reason}</small>}
                  </div>
                  <Tag tone={m.status === "approved" ? "success" : "muted"}>
                    {m.status === "pending"
                      ? "Onay bekliyor"
                      : m.status === "approved"
                        ? "Yayında"
                        : "Reddedildi"}
                  </Tag>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
export function Admin({ state, commit }: { state: Snapshot; commit: Commit }) {
  const [tab, setTab] = useState<"sites" | "memories">("sites"),
    [filter, setFilter] = useState<"pending" | "approved" | "rejected">(
      "pending",
    ),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<HeritageSite | null>(null),
    [reject, setReject] = useState<string>(),
    [reason, setReason] = useState("");
  function newSite() {
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      city: "Bursa",
      district: "",
      year: "",
      architect: "",
      kind: "cami",
      coordinates: [29.0619, 40.184],
      minutes: 15,
      description: "",
      source: "",
      stories: [],
      status: "draft",
      tier: "Tier 1",
    });
  }
  return (
    <main id="main-content" tabIndex={-1} className="admin-page">
      <aside className="admin-nav">
        <span className="eyebrow">AKAR · İÇERİK STÜDYOSU</span>
        <button
          className={tab === "sites" ? "active" : ""}
          onClick={() => setTab("sites")}
        >
          <BookOpen size={18} />
          Eserler<Tag>{state.sites.length}</Tag>
        </button>
        <button
          className={tab === "memories" ? "active" : ""}
          onClick={() => setTab("memories")}
        >
          <MessageSquare size={18} />
          Katkılar
          <Tag>
            {state.memories.filter((m) => m.status === "pending").length}
          </Tag>
        </button>
        <Notice>
          Demo paneli. Gerçek yetkilendirme ve sunucuya yayın henüz bağlı değil.
        </Notice>
      </aside>
      <section className="admin-main">
        <div className="row between">
          <div>
            <small className="eyebrow">İNTERNET KAHVE</small>
            <h1>{tab === "sites" ? "Eserler" : "Yaşayan hafızayı yönet"}</h1>
          </div>
          {tab === "sites" && (
            <button className="btn" onClick={newSite}>
              <Plus size={17} />
              Yeni eser
            </button>
          )}
        </div>
        {tab === "sites" ? (
          <>
            <input
              className="admin-search"
              placeholder="Eser ara…"
              aria-label="Panelde eser ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Eser</th>
                    <th>Şehir</th>
                    <th>Dönem</th>
                    <th>Seviye</th>
                    <th>Durum</th>
                    <th>
                      <span className="sr-only">Düzenle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.sites
                    .filter((s) =>
                      s.name
                        .toLocaleLowerCase("tr")
                        .includes(query.toLocaleLowerCase("tr")),
                    )
                    .map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.name}</strong>
                          <small>{s.stories.length} hikâye bölümü</small>
                        </td>
                        <td>{s.city}</td>
                        <td>{s.year || "—"}</td>
                        <td>
                          <Tag>{s.tier}</Tag>
                        </td>
                        <td>
                          <Tag
                            tone={
                              s.status === "published" ? "success" : "muted"
                            }
                          >
                            {s.status === "published" ? "Yayında" : "Taslak"}
                          </Tag>
                        </td>
                        <td>
                          <button
                            className="icon-btn"
                            aria-label={`${s.name} düzenle`}
                            onClick={() => setEditing(s)}
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="segmented admin-tabs">
              {(["pending", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  className={s === filter ? "active" : ""}
                  onClick={() => setFilter(s)}
                >
                  {s === "pending"
                    ? "Bekleyen"
                    : s === "approved"
                      ? "Onaylanan"
                      : "Reddedilen"}{" "}
                  · {state.memories.filter((m) => m.status === s).length}
                </button>
              ))}
            </div>
            {!state.memories.some((m) => m.status === filter) ? (
              <div className="empty-state">
                <Shield size={36} />
                <h3>Bu listede katkı yok</h3>
                <p>
                  Eser sayfasındaki İz Bırak ile yeni bir katkı
                  oluşturabilirsin.
                </p>
              </div>
            ) : (
              state.memories
                .filter((m) => m.status === filter)
                .map((m) => (
                  <div className="card moderation-card" key={m.id}>
                    {m.photo && (
                      <img
                        className="memory-photo"
                        src={m.photo}
                        alt="Ziyaretçi katkısı"
                      />
                    )}
                    <div className="grow">
                      <small>
                        {state.sites.find((s) => s.id === m.siteId)?.name} ·{" "}
                        {m.author}
                      </small>
                      <p>{m.text}</p>
                      <Tag>{m.photo ? "Fotoğraf + anı" : "Anı"}</Tag>
                      {m.reason && <p className="error">{m.reason}</p>}
                    </div>
                    {m.status === "pending" && (
                      <div className="row">
                        <button
                          className="btn"
                          onClick={() =>
                            void commit({
                              type: "moderate",
                              id: m.id,
                              status: "approved",
                            })
                          }
                        >
                          <Check size={15} />
                          Onayla
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() => {
                            setReject(m.id);
                            setReason("");
                          }}
                        >
                          <X size={15} />
                          Reddet
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </>
        )}
      </section>
      {editing && (
        <SiteEditor
          site={editing}
          onClose={() => setEditing(null)}
          onSave={async (site) => {
            const ok = await commit({ type: "site", site });
            if (ok) setEditing(null);
            return ok;
          }}
        />
      )}
      {reject && (
        <Modal title="Katkıyı reddet" onClose={() => setReject(undefined)}>
          <label className="field">
            Ret nedeni
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Kullanıcıya açıklanacak nedeni yaz…"
            />
          </label>
          <div className="modal-actions">
            <button
              className="btn"
              disabled={!reason.trim()}
              onClick={async () => {
                if (
                  await commit({
                    type: "moderate",
                    id: reject,
                    status: "rejected",
                    reason,
                  })
                )
                  setReject(undefined);
              }}
            >
              Nedeniyle reddet
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
function SiteEditor({
  site,
  onClose,
  onSave,
}: {
  site: HeritageSite;
  onClose: () => void;
  onSave: (s: HeritageSite) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(structuredClone(site)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function field<K extends keyof HeritageSite>(key: K, value: HeritageSite[K]) {
    setDraft({ ...draft, [key]: value });
  }
  return (
    <Modal
      title={site.name ? "Eseri düzenle" : "Yeni eser"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          if (!(await onSave(draft)))
            setError(
              "Kaydedilemedi. Alanları ve tarayıcı depolama alanını kontrol et.",
            );
          setBusy(false);
        }}
      >
        <div className="form-grid">
          <label className="field">
            Ad
            <input
              required
              value={draft.name}
              onChange={(e) => field("name", e.target.value)}
            />
          </label>
          <label className="field">
            Şehir
            <input
              required
              value={draft.city}
              onChange={(e) => field("city", e.target.value)}
            />
          </label>
          <label className="field">
            Yapım yılı
            <input
              value={draft.year}
              onChange={(e) => field("year", e.target.value)}
            />
          </label>
          <label className="field">
            Mimar
            <input
              value={draft.architect}
              onChange={(e) => field("architect", e.target.value)}
            />
          </label>
          <label className="field">
            Enlem
            <input
              type="number"
              step="any"
              required
              min={-90}
              max={90}
              value={draft.coordinates[1]}
              onChange={(e) =>
                field("coordinates", [
                  draft.coordinates[0],
                  Number(e.target.value),
                ])
              }
            />
          </label>
          <label className="field">
            Boylam
            <input
              type="number"
              step="any"
              required
              min={-180}
              max={180}
              value={draft.coordinates[0]}
              onChange={(e) =>
                field("coordinates", [
                  Number(e.target.value),
                  draft.coordinates[1],
                ])
              }
            />
          </label>
          <label className="field">
            Tür
            <select
              value={draft.kind}
              onChange={(e) =>
                field("kind", e.target.value as HeritageSite["kind"])
              }
            >
              <option value="cami">Cami</option>
              <option value="cesme">Çeşme</option>
              <option value="hamam">Hamam</option>
              <option value="egitim">Eğitim</option>
            </select>
          </label>
          <label className="field">
            Durum
            <select
              value={draft.status}
              onChange={(e) =>
                field("status", e.target.value as HeritageSite["status"])
              }
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayında (demo)</option>
            </select>
          </label>
        </div>
        <label className="field">
          Kısa açıklama
          <textarea
            required
            value={draft.description}
            onChange={(e) => field("description", e.target.value)}
          />
        </label>
        <label className="field">
          Kaynak / atıf
          <input
            required={draft.status === "published"}
            value={draft.source}
            onChange={(e) => field("source", e.target.value)}
          />
        </label>
        <details className="story-editor">
          <summary>Hikâye bölümleri · {draft.stories.length}</summary>
          {draft.stories.map((story, index) => (
            <div key={story.id} className="card">
              <label className="field">
                Bölüm {index + 1} başlığı
                <input
                  value={story.title}
                  onChange={(e) =>
                    field(
                      "stories",
                      draft.stories.map((s, i) =>
                        i === index ? { ...s, title: e.target.value } : s,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Anlatım
                <textarea
                  value={story.text}
                  onChange={(e) =>
                    field(
                      "stories",
                      draft.stories.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              text: e.target.value,
                              simple: e.target.value,
                            }
                          : s,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="text-btn danger"
                onClick={() =>
                  field(
                    "stories",
                    draft.stories.filter((_, i) => i !== index),
                  )
                }
              >
                Bölümü kaldır
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              field("stories", [
                ...draft.stories,
                {
                  id: crypto.randomUUID(),
                  title: "Yeni bölüm",
                  text: "",
                  simple: "",
                  trust: "representative",
                },
              ])
            }
          >
            <Plus size={16} />
            Bölüm ekle
          </button>
        </details>
        <Notice>
          Kaynak girilmesi tarihsel doğruluğu otomatik onaylamaz. Demo
          içerikleri doğrulama bekler.
        </Notice>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
