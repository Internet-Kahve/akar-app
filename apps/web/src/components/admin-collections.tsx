"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Download } from "lucide-react";
import { routes as seedRoutes } from "@akar/api-client";
import {
  kindLabels,
  normalize,
  type Command,
  type HeritageRoute,
  type HeritageSite,
  type SitePhoto,
  type Snapshot,
} from "@akar/domain";
import { HeritageMap } from "./heritage-map";
import { PhotoDialog } from "./admin-photo-dialog";
import { Notice, Tag } from "./ui";
type Commit = (command: Command) => Promise<boolean>;

export function RouteAdmin({
  state,
  commit,
}: {
  state: Snapshot;
  commit: Commit;
}) {
  const routes = state.catalogRoutes ?? seedRoutes;
  const [draft, setDraft] = useState<HeritageRoute>(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const sites =
    draft?.siteIds
      .map((id) => state.sites.find((s) => s.id === id))
      .filter((s): s is HeritageSite => !!s) ?? [];
  const duration = sites.reduce((n, s) => n + s.minutes, 0);
  let kilometers = 0;
  for (let i = 1; i < sites.length; i++) {
    const [x, y] = sites[i].coordinates,
      [a, b] = sites[i - 1].coordinates;
    // Straight-line estimate only; this is not a pedestrian routing service.
    kilometers += Math.hypot((x - a) * 85, (y - b) * 111);
  }
  function reorder(index: number, delta: number) {
    if (!draft) return;
    const ids = [...draft.siteIds];
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    setDraft({ ...draft, siteIds: ids });
  }
  async function save(status: "published" | "draft") {
    if (!draft) return;
    setBusy(true);
    const route = {
      ...draft,
      status,
      minutes: duration,
      distance: `${kilometers.toFixed(1).replace(".", ",")} km`,
    };
    const next = routes.some((r) => r.id === route.id)
      ? routes.map((r) => (r.id === route.id ? route : r))
      : [...routes, route];
    if (await commit({ type: "catalog-routes", routes: next })) {
      setMessage("Rota kaydedildi.");
      setDraft(undefined);
    }
    setBusy(false);
  }
  if (!draft)
    return (
      <section className="admin-main">
        <div className="row between">
          <h1>Rotalar</h1>
          <button
            className="btn"
            onClick={() =>
              setDraft({
                id: crypto.randomUUID(),
                name: "",
                description: "",
                siteIds: [],
                minutes: 0,
                distance: "0 km",
                theme: "Bursa",
                status: "draft",
              })
            }
          >
            <Plus size={16} />
            Yeni rota
          </button>
        </div>
        {message && <p role="status">{message}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rota</th>
                <th>Durak</th>
                <th>Durum</th>
                <th>Düzenle</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.siteIds.length}</td>
                  <td>
                    <Tag>{r.status === "draft" ? "Taslak" : "Yayında"}</Tag>
                  </td>
                  <td>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setMessage("");
                        setDraft(structuredClone(r));
                      }}
                      aria-label={`${r.name} rotasını düzenle`}
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  return (
    <section className="admin-main">
      <header className="editor-header">
        <div>
          <h1>{draft.name || "Yeni rota"}</h1>
          <small>Rotalar › Düzenle</small>
        </div>
        <div className="editor-actions">
          <button className="btn secondary" onClick={() => setDraft(undefined)}>
            Vazgeç
          </button>
          <button
            className="btn soft"
            disabled={busy || !draft.name.trim()}
            onClick={() => void save("draft")}
          >
            Taslak kaydet
          </button>
          <button
            className="btn"
            disabled={
              busy ||
              !draft.name.trim() ||
              sites.length < 2 ||
              sites.some((s) => s.status !== "published")
            }
            onClick={() => void save("published")}
          >
            Yayınla
          </button>
        </div>
      </header>
      <div className="editor-layout">
        <div>
          <div className="form-grid">
            <label className="field">
              Rota adı (TR)
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="field">
              Rota adı (EN)
              <input
                value={draft.nameEn ?? ""}
                onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            Kısa açıklama (TR)
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <h3>Duraklar</h3>
          <div className="admin-stops">
            {sites.map((s, i) => (
              <div className="card row" key={s.id}>
                <strong>
                  {i + 1}. {s.name}
                </strong>
                <div className="row">
                  <button
                    className="icon-btn"
                    aria-label={`${s.name} yukarı taşı`}
                    disabled={i === 0}
                    onClick={() => reorder(i, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`${s.name} aşağı taşı`}
                    disabled={i === sites.length - 1}
                    onClick={() => reorder(i, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`${s.name} durağını kaldır`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        siteIds: draft.siteIds.filter((id) => id !== s.id),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="field">
            Durak ekle
            <select
              value=""
              onChange={(e) =>
                e.target.value &&
                setDraft({
                  ...draft,
                  siteIds: [...draft.siteIds, e.target.value],
                })
              }
            >
              <option value="">Eser seç…</option>
              {state.sites
                .filter((s) => !draft.siteIds.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.status === "draft" ? " (taslak)" : ""}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Tema / rozet adı
            <input
              value={draft.theme}
              onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
            />
          </label>
          <p>
            {duration} dk ziyaret · {kilometers.toFixed(1).replace(".", ",")} km
            kuş uçuşu
          </p>
          <Notice>
            Harita durakları şematik bağlar; yaya güzergâhı ve yol süresi
            hesaplamaz. Yayın için en az iki yayındaki eser gerekir.
          </Notice>
          <details className="editor-details">
            <summary>Durak içerikleri</summary>
            <p>
              Bulmaca sorusu, eski/yeni fotoğraf eşlemesi ve Akar akışı
              editörleri sonraki aşamada. Yapılacaklar listesine kaydedildi.
            </p>
          </details>
        </div>
        <aside>
          <h3>Harita önizleme</h3>
          <div className="admin-route-map">
            <HeritageMap
              sites={sites}
              routeIds={draft.siteIds}
              onSelect={() => {}}
              collapsed={false}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

export function PhotoAdmin({
  state,
  commit,
  live = false,
}: {
  state: Snapshot;
  commit: Commit;
  live?: boolean;
}) {
  const [query, setQuery] = useState(""),
    [siteId, setSiteId] = useState(""),
    [editing, setEditing] = useState<SitePhoto>();
  const [message, setMessage] = useState("");
  const photos = [
    ...new Map(
      state.sites.flatMap((s) => s.photos ?? []).map((p) => [p.id, p]),
    ).values(),
  ];
  const sources = [
    ...new Map(
      state.sites.flatMap((s) => s.sources ?? []).map((s) => [s.id, s]),
    ).values(),
  ];
  return (
    <section className="admin-main">
      <h1>Kartlar ve fotoğraflar</h1>
      <p className="muted">Eserlerin ortak görsel havuzu</p>
      <div className="form-grid">
        <label className="field">
          Fotoğraf ara
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="field">
          Eser
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Tüm eserler</option>
            {state.sites.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {message && <p role="status">{message}</p>}
      {state.sites
        .filter((s) => !siteId || s.id === siteId)
        .map((s) => (
          <section key={s.id} className="library-group">
            <h3>
              {s.name} · {s.photos?.length ?? 0} görsel
            </h3>
            <div className="photo-pool">
              {s.photos
                ?.filter((p) =>
                  normalize(`${p.title} ${p.alt}`).includes(normalize(query)),
                )
                .map((p) => (
                  <button
                    className="photo-option"
                    key={p.id}
                    onClick={() => setEditing(p)}
                  >
                    <img src={p.src} alt={p.alt} />
                    <strong>{p.title || p.alt}</strong>
                    <small>
                      Kullanıldığı:{" "}
                      {state.sites
                        .filter(
                          (x) =>
                            x.coverPhotoId === p.id ||
                            x.stories.some((b) => b.photoId === p.id),
                        )
                        .map((x) => x.name)
                        .join(" · ")}
                    </small>
                  </button>
                ))}
            </div>
            {!s.photos?.length && (
              <p className="muted">
                Bu eserin görseli yok. Eserin Bilgiler veya Hikâye adımından
                ekleyebilirsin.
              </p>
            )}
          </section>
        ))}
      <Notice>
        Burada düzenlenen fotoğraf aynı görseli kullanan bütün eserlerde ve
        cümlelerde güncellenir.
      </Notice>
      {editing && (
        <PhotoDialog
          photos={photos}
          sources={sources}
          initial={editing}
          metadataOnly={live}
          onClose={() => setEditing(undefined)}
          onChoose={async (photo, newSource) => {
            const source =
              newSource ?? sources.find((s) => s.id === photo.sourceId);
            if (source && (await commit({ type: "photo", photo, source }))) {
              setEditing(undefined);
              setMessage("Görsel tüm kullanımlarında güncellendi.");
            }
          }}
        />
      )}
    </section>
  );
}
const importFields = {
  name: "Ad (TR)",
  nameEn: "Ad (EN)",
  city: "Şehir",
  district: "İlçe",
  kind: "Tür",
  description: "Açıklama",
  lat: "Enlem",
  lng: "Boylam",
  year: "Yıl",
  source: "Kaynak / sayfa",
};
type ImportField = keyof typeof importFields;
export function ImportAdmin({
  state,
  commit,
}: {
  state: Snapshot;
  commit: Commit;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [mapping, setMapping] = useState<Partial<Record<ImportField, string>>>({}),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [source, setSource] = useState("");
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const existing = new Set(
    state.sites.map((s) => normalize(`${s.name}|${s.district}`)),
  );
  const results = rows.map((row, i) => {
    const read = (key: ImportField) =>
      String(row[mapping[key] ?? ""] ?? "").trim();
    const rawKind = read("kind"),
      kind = (Object.keys(kindLabels) as HeritageSite["kind"][]).find(
        (k) =>
          normalize(k) === normalize(rawKind) ||
          normalize(kindLabels[k]) === normalize(rawKind),
      );
    const lat = read("lat") ? Number(read("lat")) : NaN,
      lng = read("lng") ? Number(read("lng")) : NaN;
    const key = normalize(`${read("name")}|${read("district")}`),
      duplicate = existing.has(key);
    existing.add(key);
    const issue = duplicate
      ? "Kopya kayıt; atlanacak"
      : !read("name")
        ? "Ad eksik"
        : !kind
          ? "Tür belirsiz"
          : !Number.isFinite(lat) ||
              !Number.isFinite(lng) ||
              Math.abs(lat) > 90 ||
              Math.abs(lng) > 180
            ? "Konum eksik / geçersiz"
            : !source.trim() && !read("source")
              ? "Kaynak eksik"
              : "";
    return { i, read, kind: kind ?? "cami", lat, lng, issue };
  });
  const ready = results.filter((r) => !r.issue);
  async function load(file?: File) {
    if (!file) return;
    setError("");
    setMessage("");
    setRows([]);
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("JSON en fazla 2 MB olabilir.");
      const data: unknown = JSON.parse(await file.text());
      if (
        !Array.isArray(data) ||
        !data.length ||
        data.length > 500 ||
        data.some((r) => !r || typeof r !== "object" || Array.isArray(r))
      )
        throw new Error("1–500 kayıt içeren bir JSON dizisi seç.");
      setRows(data);
      const aliases: Record<ImportField, string[]> = {
        name: ["name", "ad"],
        nameEn: ["nameEn", "ad_en"],
        city: ["city", "il", "sehir"],
        district: ["district", "ilce"],
        kind: ["kind", "tur"],
        description: ["description", "aciklama"],
        lat: ["lat", "enlem"],
        lng: ["lng", "boylam"],
        year: ["year", "yil"],
        source: ["source", "kaynak"],
      };
      setMapping(
        Object.fromEntries(
          Object.entries(aliases).map(([k, keys]) => [
            k,
            keys.find((key) => data.some((r) => key in r)) ?? "",
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dosya okunamadı.");
    }
  }
  async function importRows() {
    setBusy(true);
    const sites: HeritageSite[] = ready.map((r) => {
      const sourceId = crypto.randomUUID(),
        title = [source.trim(), r.read("source")].filter(Boolean).join(" · ");
      return {
        id: crypto.randomUUID(),
        name: r.read("name"),
        nameEn: r.read("nameEn"),
        city: r.read("city") || "Bursa",
        district: r.read("district"),
        kind: r.kind,
        coordinates: [r.lng, r.lat],
        description: r.read("description"),
        year: r.read("year"),
        architect: "",
        minutes: 15,
        source: title,
        sources: [
          {
            id: sourceId,
            title,
            kind: "book",
            author: "",
            year: "",
            page: r.read("source"),
            url: "",
            trust: "representative",
          },
        ],
        photos: [],
        stories: [],
        status: "draft",
        editorVersion: 2,
        tier: "Tier 1",
      };
    });
    if (await commit({ type: "import-sites", sites })) {
      setMessage(`${sites.length} eser taslak olarak içe aktarıldı.`);
      setRows([]);
    }
    setBusy(false);
  }
  function download() {
    const blob = new Blob([JSON.stringify(state.sites, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "akar-eserler-demo.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="admin-main">
      <header className="editor-header">
        <div>
          <h1>Envanterden içe aktar</h1>
          <p className="muted">JSON → Alan eşleme → Doğrulama → Taslak</p>
        </div>
        <button className="btn secondary" onClick={download}>
          <Download size={16} />
          JSON dışa aktar
        </button>
      </header>
      <div className="editor-layout">
        <div>
          <label className="field">
            Envanter dosyası
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                void load(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <label className="field">
            Envanter kaynağı
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Kitap / kurum / cilt…"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          {rows.length > 0 && (
            <>
              <h3>Alan eşleme</h3>
              <div className="form-grid">
                {Object.entries(importFields).map(([key, label]) => (
                  <label className="field" key={key}>
                    {label}
                    <select
                      value={mapping[key as ImportField] ?? ""}
                      onChange={(e) =>
                        setMapping({ ...mapping, [key]: e.target.value })
                      }
                    >
                      <option value="">Alan seç</option>
                      {columns.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <aside>
          <h3>Doğrulama</h3>
          <div className="publish-checks">
            <p>{rows.length} kayıt okundu</p>
            <p>{ready.length} hazır</p>
            <p>{rows.length - ready.length} eksik veya kopya kayıt atlanacak</p>
            {results
              .filter((r) => r.issue)
              .slice(0, 20)
              .map((r) => (
                <p key={r.i}>
                  {r.i + 1}. {r.read("name") || "Adsız"}: {r.issue}
                </p>
              ))}
          </div>
          <button
            className="btn"
            disabled={busy || !ready.length}
            onClick={() => void importRows()}
          >
            Taslak olarak içe aktar ({ready.length})
          </button>
          <Notice>
            Yalnız hazır kayıtlar alınır. Aynı ad + ilçedeki kayıtlar korunur ve
            atlanır; hiçbiri otomatik yayınlanmaz. Konumu eksik satırları
            dosyada düzelterek tekrar seç.
          </Notice>
        </aside>
      </div>
    </section>
  );
}
