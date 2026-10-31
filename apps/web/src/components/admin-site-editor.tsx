"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  MoveUp,
  MoveDown,
  Box,
} from "lucide-react";
import {
  kindLabels,
  trustLabels,
  publicationIssues,
  type HeritageSite,
  type SitePhoto,
  type SiteSource,
  type StoryBlock,
  type MapPlacement,
  type Trust,
} from "@akar/domain";
import { ApiError, routes, type AkarClient } from "@akar/api-client";
import { Modal, Notice, Tag } from "./ui";
import { PhotoDialog } from "./admin-photo-dialog";
import { PartCardsStep } from "./admin-part-cards";
import { PlacementSection, usePlacementEditor } from "./admin-placement";
import { prepareModel } from "../lib/editor-media";
const steps = [
  "Model",
  "Bilgiler",
  "Kaynaklar",
  "Hikâye",
  "Parça kartları",
  "Yayın",
];
function prepareSite(site: HeritageSite): HeritageSite {
  const copy = structuredClone(site);
  return {
    ...copy,
    editorVersion: 2,
    // Story-only media must stay selectable and valid when a seeded site enters the editor.
    photos: [
      ...new Map(
        [...(copy.photos ?? []), ...(copy.storyPhotos ?? [])].map((p) => [
          p.id,
          p,
        ]),
      ).values(),
    ],
    sources:
      copy.sources ??
      (copy.source
        ? [
            {
              id: crypto.randomUUID(),
              title: copy.source,
              kind: "field",
              author: "",
              year: "",
              page: "",
              url: "",
              trust: "representative",
            },
          ]
        : []),
  };
}
/** The site as the editor compares it: the placement has its own save and is not part of it. */
const siteKey = (site: HeritageSite) =>
  JSON.stringify(
    site.model
      ? { ...site, model: { ...site.model, placement: undefined } }
      : site,
  );
/** The Turkish text of a failed voice-over or translation request. */
function storyJobError(kind: "translate" | "narrate", error: unknown) {
  if (error instanceof ApiError && error.status === 503)
    return kind === "narrate"
      ? "Seslendirme hizmeti yapılandırılmamış."
      : "Çeviri hizmeti yapılandırılmamış.";
  if (error instanceof ApiError && error.status === 429)
    return "Günlük seslendirme sınırına ulaşıldı. Yarın yeniden dene.";
  return error instanceof Error && error.message
    ? error.message
    : "İşlem yapılamadı. Biraz sonra yeniden dene.";
}
const translationLabels = {
  machine: "makine çevirisi",
  reviewed: "onaylı",
} as const;
/** EN column of a sentence in the panel: what is written and where it came from. */
function englishLabel(s: StoryBlock) {
  const parts = [
    s.textEn && `Cümle ${translationLabels[s.textEnStatus ?? "reviewed"]}`,
    s.simpleEn && `sade ${translationLabels[s.simpleEnStatus ?? "reviewed"]}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "İngilizce yok";
}
export function SiteEditor({
  site,
  sites,
  catalogRoutes = routes,
  onClose,
  onSave,
  loadPlacement,
  savePlacement,
  narrateSite,
  translateSite,
  live,
}: {
  site: HeritageSite;
  sites: HeritageSite[];
  catalogRoutes?: typeof routes;
  onClose: () => void;
  onSave: (s: HeritageSite) => Promise<HeritageSite>;
  /** The placement saved for the site's model, hidden or not (`AkarClient.getMapPlacement`). */
  loadPlacement: (siteId: string) => Promise<MapPlacement | null>;
  /** Saves the whole placement of the site's model (the `map-placement` command). */
  savePlacement: (siteId: string, placement: MapPlacement) => Promise<void>;
  /** Records the voice-overs of the saved story texts (`AkarClient.narrateSite`). */
  narrateSite: AkarClient["narrateSite"];
  /** Fills the empty English story texts with a machine draft (`AkarClient.translateSite`). */
  translateSite: AkarClient["translateSite"];
  live: boolean;
}) {
  const [draft, setDraft] = useState(() => prepareSite(site));
  const [step, setStep] = useState(0),
    [activeStory, setActiveStory] = useState(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const [photoTarget, setPhotoTarget] = useState<string>(),
    [photoEdit, setPhotoEdit] = useState<SitePhoto>();
  const [preview, setPreview] = useState(false),
    [closing, setClosing] = useState(false);
  const [baseline, setBaseline] = useState(() => siteKey(draft));
  // The running voice-over or translation request ("narrate:s1", "translate:all") and its outcome.
  const [storyJob, setStoryJob] = useState<string | null>(null),
    [storyNote, setStoryNote] = useState<{ ok: boolean; text: string } | null>(null);
  // The server has the site and its model: what a placement needs (409 otherwise).
  const persisted = Boolean(sites.find((s) => s.id === draft.id)?.model);
  const placement = usePlacementEditor({
    siteId: draft.id,
    initial: site.model?.placement,
    coordinates: draft.coordinates,
    persisted,
    load: loadPlacement,
    onSave: savePlacement,
  });
  const dirty = siteKey(draft) !== baseline || placement.dirty;
  // Both requests work on the texts the server holds: the site must be saved there, with no edit left on this screen.
  const storyJobsReady =
    sites.some((s) => s.id === draft.id) && !dirty && !busy && !storyJob;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function field<K extends keyof HeritageSite>(key: K, value: HeritageSite[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
    setSaved("");
  }
  function storyField(id: string, patch: Partial<StoryBlock>) {
    setDraft((p) => ({
      ...p,
      stories: p.stories.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }
  /** Voice-over or translation of the whole site or one sentence; the editor then shows the site as the server has it. */
  async function runStoryJob(kind: "translate" | "narrate", storyBlockId?: string) {
    setStoryJob(`${kind}:${storyBlockId ?? "all"}`);
    setStoryNote(null);
    try {
      const run =
        kind === "translate"
          ? await translateSite(draft.id, storyBlockId)
          : await narrateSite(draft.id, storyBlockId);
      const fresh = prepareSite(run.site);
      setDraft(fresh);
      setBaseline(siteKey(fresh));
      const text =
        "translated" in run
          ? `${run.translated} cümlenin İngilizcesi makine çevirisiyle dolduruldu, ${run.skipped} cümleye dokunulmadı. Çeviriyi gözden geçirip kaydedince "onaylı" olur.`
          : !live
            ? "Demo sürümü ses üretmez; oynatıcı cihazın sesiyle okur."
            : `${run.generated} ses kaydı üretildi${run.stale ? ` (${run.stale} tanesi değişen metnin yenisi)` : ""}, ${run.skipped} güncel kayıt olduğu gibi kaldı.`;
      setStoryNote({ ok: true, text });
    } catch (e) {
      setStoryNote({ ok: false, text: storyJobError(kind, e) });
    } finally {
      setStoryJob(null);
    }
  }
  function sourceField(id: string, patch: Partial<SiteSource>) {
    setDraft((p) => ({
      ...p,
      sources: p.sources?.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }
  const issues = publicationIssues(draft);
  const photos = draft.photos ?? [],
    sources = draft.sources ?? [];
  const allPhotos = [
    ...new Map(
      [...sites.flatMap((s) => s.photos ?? []), ...photos].map((p) => [
        p.id,
        p,
      ]),
    ).values(),
  ];
  const allSources = [
    ...new Map(
      [...sites.flatMap((s) => s.sources ?? []), ...sources].map((s) => [
        s.id,
        s,
      ]),
    ).values(),
  ];
  const cover = photos.find((p) => p.id === draft.coverPhotoId);
  const story = draft.stories[activeStory];
  const selectedPhoto = photos.find((p) => p.id === story?.photoId) ?? cover;
  async function save(status: HeritageSite["status"], exit = false) {
    if (status === "published" && issues.length) {
      setStep(steps.length - 1);
      setError("Yayınlamadan önce aşağıdaki eksikleri tamamla.");
      return;
    }
    setBusy(true);
    setError("");
    const next = {
      ...draft,
      name: draft.name.trim() || "Adsız eser",
      status,
      source: sources.map((s) => s.title).join(" · "),
    };
    try {
      const canonical = await onSave(next);
      setDraft(canonical);
      setBaseline(siteKey(canonical));
      setSaved(
        live
          ? canonical.status === "published"
            ? "Eser yayında."
            : "Taslak sunucuya kaydedildi."
          : canonical.status === "published"
            ? "Eser demo keşfinde yayında."
            : "Taslak bu tarayıcıya kaydedildi.",
      );
      // The placement has its own save; one still open goes out with the site, now that the server has the model.
      const refused =
        placement.dirty && canonical.model
          ? await placement.save(canonical.id)
          : null;
      if (refused)
        setError(`Eser kaydedildi, yerleşim kaydedilemedi: ${refused}`);
      else if (exit) onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kayıt yapılamadı. Değişikliklerin bu ekranda duruyor.",
      );
    } finally {
      setBusy(false);
    }
  }
  function choosePhoto(photo: SitePhoto, newSource?: SiteSource) {
    setDraft((p) => {
      const source =
        newSource ?? allSources.find((s) => s.id === photo.sourceId);
      return {
        ...p,
        photos: [...(p.photos ?? []).filter((x) => x.id !== photo.id), photo],
        sources:
          source && !p.sources?.some((s) => s.id === source.id)
            ? [...(p.sources ?? []), source]
            : p.sources,
        coverPhotoId: photoTarget === "cover" ? photo.id : p.coverPhotoId,
        stories: p.stories.map((s) =>
          s.id === photoTarget ? { ...s, photoId: photo.id } : s,
        ),
      };
    });
    setPhotoTarget(undefined);
    setPhotoEdit(undefined);
  }
  function reorder(index: number, direction: number) {
    const stories = [...draft.stories];
    const to = index + direction;
    [stories[index], stories[to]] = [stories[to], stories[index]];
    field("stories", stories);
    setActiveStory(to);
  }
  return (
    <section className="admin-main site-editor">
      <header className="editor-header">
        <div>
          <h1>
            {draft.name || "Yeni eser"} · {steps[step]}
          </h1>
          <button
            className="back"
            onClick={() => (dirty ? setClosing(true) : onClose())}
          >
            Eserler
          </button>
          <span className="editor-breadcrumb"> › {steps[step]}</span>
        </div>
        <div className="editor-actions">
          <button className="btn secondary" onClick={() => setPreview(true)}>
            Önizle
          </button>
          <button
            className="btn soft"
            disabled={busy}
            onClick={() => void save("draft")}
          >
            Taslak kaydet
          </button>
          <button
            className="btn"
            disabled={busy}
            onClick={() => void save("published")}
          >
            Yayınla
          </button>
        </div>
      </header>
      <div className="editor-layout">
        <div className="editor-form">
          <nav className="editor-steps" aria-label="Eser ekleme adımları">
            {steps.map((name, i) => (
              <button
                key={name}
                className={step === i ? "active" : ""}
                aria-current={step === i ? "step" : undefined}
                onClick={() => {
                  setStep(i);
                  setError("");
                }}
              >
                {i + 1} {name}
              </button>
            ))}
          </nav>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="editor-saved" role="status">
              <Check size={16} />
              {saved}
            </p>
          )}
          {step === 0 && (
            <div className="editor-step-content">
              <h2>3D model</h2>
              <p className="muted">
                Model isteğe bağlı. Fotoğraflarla başlayabilir, modeli sonra
                ekleyebilirsin.
              </p>
              <div
                className="upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void uploadModel(e.dataTransfer.files[0]);
                }}
              >
                <Box size={36} />
                <strong>
                  {draft.model?.name || "GLB dosyasını sürükle veya seç"}
                </strong>
                <label className="field">
                  Model dosyası
                  <input
                    type="file"
                    accept=".glb"
                    disabled={busy}
                    onChange={(e) => {
                      void uploadModel(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <small>
                  GLB 2.0 · En fazla 5 MB · Draco sıkıştırma önerilir
                </small>
              </div>
              {draft.model && (
                <>
                  <div className="row between">
                    <Tag>
                      {(draft.model.bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                      {draft.model.parts.length} parça
                      {draft.model.triangles != null &&
                        ` · ${draft.model.triangles.toLocaleString("tr-TR")} üçgen`}
                    </Tag>
                    <button
                      className="btn secondary"
                      onClick={() => field("model", undefined)}
                    >
                      Modeli kaldır
                    </button>
                  </div>
                  <label className="field">
                    Model güven etiketi
                    <select
                      value={draft.model.trust}
                      onChange={(e) =>
                        field("model", {
                          ...draft.model!,
                          trust: e.target.value as Trust,
                        })
                      }
                    >
                      {Object.entries(trustLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <details className="editor-details">
                    <summary>
                      Model parçaları ({draft.model.parts.length})
                    </summary>
                    <ul>
                      {draft.model.parts.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </details>
                  <PlacementSection
                    editor={placement}
                    siteId={draft.id}
                    city={draft.city}
                    modelSrc={draft.model.src}
                    parts={draft.model.parts}
                    persisted={persisted}
                  />
                </>
              )}
              <Notice>
                Model dosyası ve parça adları taslakta saklanır. Etkileşimli 3D,
                kamera açıları ve ses dosyası bağlama sonraki geliştirme
                aşamasında; önizleme şu an fotoğrafla çalışır.
              </Notice>
              <button className="btn secondary" onClick={() => setStep(1)}>
                <ImagePlus size={17} />
                Fotoğrafla devam et
              </button>
            </div>
          )}
          {step === 1 && (
            <div className="editor-step-content">
              <div className="form-grid">
                {textField("name", "Ad (TR)")}
                {textField("nameEn", "Ad (EN)")}
                {textField("year", "Yapım yılı / tarih aralığı")}
                {textField("patron", "Bâni")}
                {textField("architect", "Mimar")}
                {textField("era", "Dönem")}
                {textField("city", "Şehir")}
                {textField("district", "İlçe")}
                <label className="field">
                  Tür
                  <select
                    value={draft.kind}
                    onChange={(e) =>
                      field("kind", e.target.value as HeritageSite["kind"])
                    }
                  >
                    {Object.entries(kindLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Vakıf rolü
                  <select
                    value={draft.role ?? "hayrat"}
                    onChange={(e) =>
                      field("role", e.target.value as HeritageSite["role"])
                    }
                  >
                    <option value="hayrat">Hayrat · hizmet sunan</option>
                    <option value="akar">Akar · gelir sağlayan</option>
                    <option value="both">Akar ve hayrat</option>
                  </select>
                </label>
                {["Enlem", "Boylam"].map((label, i) => (
                  <label className="field" key={label}>
                    {label}
                    <input
                      type="number"
                      step="any"
                      min={i ? -180 : -90}
                      max={i ? 180 : 90}
                      value={
                        Number.isNaN(draft.coordinates[1 - i])
                          ? ""
                          : draft.coordinates[1 - i]
                      }
                      onChange={(e) => {
                        const coords: [number, number] = [...draft.coordinates];
                        coords[1 - i] =
                          e.target.value === "" ? NaN : Number(e.target.value);
                        field("coordinates", coords);
                      }}
                    />
                  </label>
                ))}
              </div>
              {textField("address", "Açık adres")}
              <label className="field">
                Gelir / hizmet ilişkisi
                <select
                  value={draft.relatedSiteId ?? ""}
                  onChange={(e) => field("relatedSiteId", e.target.value)}
                >
                  <option value="">İlişki yok / henüz belirlenmedi</option>
                  {sites
                    .filter((s) => s.id !== draft.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Kısa tanım (TR)
                <textarea
                  value={draft.description}
                  onChange={(e) => field("description", e.target.value)}
                />
              </label>
              <label className="field">
                Kısa tanım (EN)
                <textarea
                  value={draft.descriptionEn ?? ""}
                  onChange={(e) => field("descriptionEn", e.target.value)}
                />
              </label>
              <label className="field">
                Gezinti süresi (dakika)
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={draft.minutes}
                  onChange={(e) =>
                    field("minutes", Math.max(1, Number(e.target.value)))
                  }
                />
              </label>
              <h3>Kapak fotoğrafı</h3>
              <div className="cover-picker">
                {cover && <img src={cover.src} alt={cover.alt} />}
                <button
                  className="btn secondary"
                  onClick={() => {
                    setPhotoEdit(undefined);
                    setPhotoTarget("cover");
                  }}
                >
                  <ImagePlus size={16} />
                  {cover ? "Kapak fotoğrafını değiştir" : "Kapak fotoğrafı seç"}
                </button>
                {cover && (
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setPhotoEdit(cover);
                      setPhotoTarget("cover");
                    }}
                  >
                    Fotoğraf bilgilerini düzenle
                  </button>
                )}
              </div>
              {!sources.length && (
                <Notice>
                  Fotoğrafı seçerken yeni kaynak ekleyebilir veya Kaynaklar
                  adımındaki bir kaynağı kullanabilirsin.
                </Notice>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="editor-step-content">
              <div className="row between">
                <h2>Kaynaklar</h2>
                <button
                  className="btn secondary"
                  onClick={() =>
                    field("sources", [
                      ...sources,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        kind: "book",
                        author: "",
                        year: "",
                        page: "",
                        url: "",
                        trust: "representative",
                      },
                    ])
                  }
                >
                  <Plus size={16} />
                  Kaynak ekle
                </button>
              </div>
              {!sources.length && (
                <Notice>
                  Kitap, makale, arşiv veya saha notu ekle. Fotoğrafın ve her
                  cümlenin kaynağı ayrı seçilir.
                </Notice>
              )}
              {sources.map((s, i) => (
                <fieldset className="source-editor card" key={s.id}>
                  <legend>Kaynak {i + 1}</legend>
                  <div className="form-grid">
                    <label className="field">
                      Kaynak türü
                      <select
                        value={s.kind}
                        onChange={(e) =>
                          sourceField(s.id, {
                            kind: e.target.value as SiteSource["kind"],
                          })
                        }
                      >
                        <option value="book">Kitap</option>
                        <option value="article">Makale</option>
                        <option value="archive">Arşiv</option>
                        <option value="web">Web</option>
                        <option value="field">Saha notu</option>
                      </select>
                    </label>
                    <label className="field">
                      Kaynak güven etiketi
                      <select
                        value={s.trust}
                        onChange={(e) =>
                          sourceField(s.id, { trust: e.target.value as Trust })
                        }
                      >
                        {Object.entries(trustLabels).map(([k, v]) => (
                          <option value={k} key={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {(
                    [
                      ["title", "Kaynak başlığı"],
                      ["author", "Yazar / kurum"],
                      ["year", "Yıl"],
                      ["page", "Sayfa / kayıt no"],
                      ["url", "Bağlantı"],
                    ] as const
                  ).map(([key, label]) => (
                    <label className="field" key={key}>
                      {label}
                      <input
                        value={s[key]}
                        onChange={(e) =>
                          sourceField(s.id, { [key]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <button
                    className="btn secondary"
                    disabled={
                      photos.some((p) => p.sourceId === s.id) ||
                      draft.stories.some((b) => b.sourceId === s.id) ||
                      (draft.partCards ?? []).some((c) => c.sourceId === s.id)
                    }
                    onClick={() =>
                      field(
                        "sources",
                        sources.filter((x) => x.id !== s.id),
                      )
                    }
                  >
                    <Trash2 size={15} />
                    Kaynağı kaldır
                  </button>
                  <small className="muted">
                    Kullanılan kaynak kaldırılmaz; önce fotoğraf, cümle ve
                    parça kartı bağlantılarını değiştir.
                  </small>
                </fieldset>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="editor-step-content">
              <div className="row between">
                <h2>Hikâye cümleleri</h2>
                <button
                  className="btn secondary"
                  onClick={() => {
                    setActiveStory(draft.stories.length);
                    field("stories", [
                      ...draft.stories,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        text: "",
                        simple: "",
                        trust: "representative",
                        sourceId: sources[0]?.id,
                        photoId: cover?.id,
                      },
                    ]);
                  }}
                >
                  <Plus size={16} />
                  Cümle ekle
                </button>
              </div>
              <p className="muted">
                Her cümleye bir fotoğraf ve kaynak bağla. Sıralama önizlemeye de
                yansır.
              </p>
              <div className="story-jobs">
                <div className="row">
                  <button
                    className="btn secondary"
                    disabled={!storyJobsReady || !draft.stories.length}
                    onClick={() => void runStoryJob("translate")}
                  >
                    {storyJob === "translate:all"
                      ? "Çevriliyor…"
                      : "İngilizceye çevir"}
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!storyJobsReady || !draft.stories.length}
                    onClick={() => void runStoryJob("narrate")}
                  >
                    {storyJob === "narrate:all" ? "Seslendiriliyor…" : "Seslendir"}
                  </button>
                </div>
                <small className="muted">
                  İşlem sunucudaki kayıtlı metinleri kullanır: eserde
                  kaydedilmemiş değişiklik varken çalışmaz. Çeviri yalnız boş
                  İngilizce alanları doldurur; seslendirme yalnız eksik ya da
                  metni değişmiş kayıtları üretir.
                </small>
                {!live && (
                  <small className="muted">
                    Demo sürümünde çeviri yer tutucudur ve ses üretilmez.
                  </small>
                )}
                {storyNote &&
                  (storyNote.ok ? (
                    <p className="editor-saved" role="status">
                      <Check size={16} />
                      {storyNote.text}
                    </p>
                  ) : (
                    <p className="error" role="alert">
                      {storyNote.text}
                    </p>
                  ))}
              </div>
              {!draft.stories.length && (
                <Notice>İlk cümleyi ekleyerek anlatımı oluştur.</Notice>
              )}
              {draft.stories.map((s, i) => (
                <fieldset
                  className={`cue-editor card ${activeStory === i ? "active" : ""}`}
                  key={s.id}
                  onFocus={() => setActiveStory(i)}
                >
                  <legend>Cümle {i + 1}</legend>
                  <div className="cue-top">
                    <label className="field">
                      Cümle başlığı
                      <input
                        value={s.title}
                        onChange={(e) =>
                          storyField(s.id, { title: e.target.value })
                        }
                        placeholder="İsteğe bağlı"
                      />
                    </label>
                    <div className="row">
                      <button
                        className="icon-btn"
                        aria-label={`${i + 1}. cümleyi yukarı taşı`}
                        disabled={i === 0}
                        onClick={() => reorder(i, -1)}
                      >
                        <MoveUp size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        aria-label={`${i + 1}. cümleyi aşağı taşı`}
                        disabled={i === draft.stories.length - 1}
                        onClick={() => reorder(i, 1)}
                      >
                        <MoveDown size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        aria-label={`${i + 1}. cümleyi kaldır`}
                        onClick={() => {
                          field(
                            "stories",
                            draft.stories.filter((b) => b.id !== s.id),
                          );
                          setActiveStory(0);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <label className="field">
                    Cümle (TR)
                    <textarea
                      value={s.text}
                      onChange={(e) =>
                        storyField(s.id, { text: e.target.value })
                      }
                    />
                  </label>
                  <div className="story-job-line">
                    <small className="muted">
                      EN: {englishLabel(s)} ·{" "}
                      {s.narrations?.length
                        ? `ses hazır (${s.narrations.length})`
                        : "ses yok"}
                    </small>
                    <button
                      className="btn soft"
                      disabled={!storyJobsReady}
                      onClick={() => void runStoryJob("translate", s.id)}
                    >
                      {storyJob === `translate:${s.id}`
                        ? "Çevriliyor…"
                        : "İngilizceye çevir"}
                    </button>
                    <button
                      className="btn soft"
                      disabled={!storyJobsReady}
                      onClick={() => void runStoryJob("narrate", s.id)}
                    >
                      {storyJob === `narrate:${s.id}`
                        ? "Seslendiriliyor…"
                        : "Seslendir"}
                    </button>
                  </div>
                  <div className="cue-photo">
                    {photos.find((p) => p.id === s.photoId) && (
                      <img
                        src={photos.find((p) => p.id === s.photoId)!.src}
                        alt={photos.find((p) => p.id === s.photoId)!.alt}
                      />
                    )}
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setPhotoEdit(undefined);
                        setPhotoTarget(s.id);
                      }}
                    >
                      <ImagePlus size={16} />
                      {s.photoId ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
                    </button>
                  </div>
                  <label className="field">
                    Cümlenin kaynağı
                    <select
                      value={s.sourceId ?? ""}
                      onChange={(e) =>
                        storyField(s.id, { sourceId: e.target.value })
                      }
                    >
                      <option value="">Kaynak seç</option>
                      {sources.map((src) => (
                        <option value={src.id} key={src.id}>
                          {src.title || "Adsız kaynak"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <details className="editor-details">
                    <summary>Dil, güven ve ek alanlar</summary>
                    <label className="field">
                      Cümle güven etiketi
                      <select
                        value={s.trust}
                        onChange={(e) =>
                          storyField(s.id, { trust: e.target.value as Trust })
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
                      Cümle (EN)
                      <textarea
                        value={s.textEn ?? ""}
                        onChange={(e) =>
                          storyField(s.id, { textEn: e.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      Sade anlatım
                      <textarea
                        value={s.simple}
                        onChange={(e) =>
                          storyField(s.id, { simple: e.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      Sade anlatım (EN)
                      <textarea
                        value={s.simpleEn ?? ""}
                        onChange={(e) =>
                          storyField(s.id, { simpleEn: e.target.value })
                        }
                      />
                    </label>
                    {draft.model && (
                      <>
                        <label className="check-row">
                          <input
                            type="checkbox"
                            checked={s.showCard ?? false}
                            onChange={(e) =>
                              storyField(s.id, { showCard: e.target.checked })
                            }
                          />
                          Kart göster
                        </label>
                        <label className="field">
                          Vurgulanacak parçalar
                          <select
                            multiple
                            value={s.highlights ?? []}
                            onChange={(e) =>
                              storyField(s.id, {
                                highlights: Array.from(
                                  e.target.selectedOptions,
                                  (o) => o.value,
                                ),
                              })
                            }
                          >
                            {draft.model.parts.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </label>
                        <small className="muted">
                          Kart ve vurgu seçimleri saklanır; 3D oynatıcı
                          bağlantısı sonraki aşamada.
                        </small>
                      </>
                    )}
                  </details>
                </fieldset>
              ))}
            </div>
          )}
          {step === 4 && (
            <PartCardsStep
              cards={draft.partCards ?? []}
              modelParts={draft.model?.parts}
              photos={[
                ...photos,
                ...new Map(
                  (draft.partCards ?? [])
                    .flatMap((c) => c.photos)
                    .filter((p) => !photos.some((g) => g.id === p.id))
                    .map((p) => [p.id, p]),
                ).values(),
              ]}
              sources={sources}
              onChange={(cards) => field("partCards", cards)}
            />
          )}
          {step === 5 && (
            <div className="editor-step-content">
              <h2>Yayın kontrolü</h2>
              <div className="publish-checks" role="status">
                {issues.length ? (
                  issues.map((issue) => (
                    <p key={issue}>
                      <CircleAlert size={17} />
                      {issue}
                    </p>
                  ))
                ) : (
                  <p className="editor-saved">
                    <Check size={18} />
                    Türkçe içerik yayın için hazır.
                  </p>
                )}
                <p>
                  {sources.length} kaynak · {photos.length} fotoğraf ·{" "}
                  {draft.stories.length} cümle
                </p>
              </div>
              {(!draft.nameEn ||
                !draft.descriptionEn ||
                draft.stories.some((s) => !s.textEn)) && (
                <Notice>
                  EN içeriği eksik. Türkçe yayınlanabilir; İngilizce içerik
                  taslak olarak kalır.
                </Notice>
              )}
              <label className="field">
                Seviye
                <select
                  value={draft.tier}
                  onChange={(e) =>
                    field("tier", e.target.value as HeritageSite["tier"])
                  }
                >
                  <option>Tier 1</option>
                  <option>Tier 2</option>
                  <option>Hero</option>
                </select>
              </label>
              <h3>Bağlı rotalar</h3>
              <p className="muted">
                {catalogRoutes
                  .filter((r) => r.siteIds.includes(draft.id))
                  .map((r) => r.name)
                  .join(" · ") || "Bu esere bağlı rota yok."}
              </p>
              <Notice>
                {live
                  ? "Yayınladığın değişiklikler kaydedilir ve eserin herkese açık sayfasında görünür."
                  : "Yayınlama yalnız bu tarayıcıdaki demo keşfini günceller. Sunucuya veri gönderilmez."}
              </Notice>
              <div className="row">
                <button
                  className="btn secondary"
                  onClick={() => setPreview(true)}
                >
                  Uygulamada önizle
                </button>
                <button
                  className="btn"
                  disabled={busy || issues.length > 0}
                  onClick={() => void save("published", true)}
                >
                  Yayınla ve çık
                </button>
              </div>
            </div>
          )}
          <footer className="editor-footer">
            <button
              className="btn secondary"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              {steps[step - 1] || "Geri"}
            </button>
            {step < steps.length - 1 ? (
              <button className="btn" onClick={() => setStep(step + 1)}>
                {steps[step + 1]}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => void save(draft.status, true)}
              >
                Kaydet ve çık
              </button>
            )}
          </footer>
        </div>
        <aside className="editor-preview">
          <h3>Önizleme</h3>
          <PhotoPreview
            photo={step >= 3 ? selectedPhoto : cover}
            name={draft.name}
            text={step >= 3 ? story?.text : draft.description}
          />
          {draft.stories.length > 0 && (
            <div className="preview-controls">
              <button
                className="btn secondary"
                disabled={activeStory === 0}
                onClick={() => setActiveStory(activeStory - 1)}
              >
                Önceki
              </button>
              <span>
                {activeStory + 1} / {draft.stories.length}
              </span>
              <button
                className="btn secondary"
                disabled={activeStory >= draft.stories.length - 1}
                onClick={() => setActiveStory(activeStory + 1)}
              >
                Sonraki
              </button>
            </div>
          )}
          <small className="muted">
            Değişiklikleri kaydetmeden inceleyebilirsin.
          </small>
        </aside>
      </div>
      {photoTarget && (
        <PhotoDialog
          photos={allPhotos}
          sources={allSources}
          initial={photoEdit}
          onClose={() => {
            setPhotoTarget(undefined);
            setPhotoEdit(undefined);
          }}
          onChoose={choosePhoto}
        />
      )}
      {preview && (
        <Modal title="Eser önizlemesi" onClose={() => setPreview(false)} wide>
          <PhotoPreview
            photo={selectedPhoto}
            name={draft.name}
            text={story?.text || draft.description}
          />
          <div className="preview-controls">
            <button
              className="btn secondary"
              disabled={activeStory === 0}
              onClick={() => setActiveStory(activeStory - 1)}
            >
              Önceki cümle
            </button>
            <span>
              {draft.stories.length ? activeStory + 1 : 0} /{" "}
              {draft.stories.length}
            </span>
            <button
              className="btn secondary"
              disabled={activeStory >= draft.stories.length - 1}
              onClick={() => setActiveStory(activeStory + 1)}
            >
              Sonraki cümle
            </button>
          </div>
        </Modal>
      )}
      {closing && (
        <Modal
          title="Kaydedilmemiş değişiklikler"
          onClose={() => setClosing(false)}
        >
          <p>Eseri taslak olarak kaydedebilir veya son kayda dönebilirsin.</p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={onClose}>
              Kaydetmeden çık
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => void save("draft", true)}
            >
              Taslağı kaydet ve çık
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
  function textField(
    key:
      | "name"
      | "nameEn"
      | "year"
      | "patron"
      | "architect"
      | "era"
      | "city"
      | "district"
      | "address",
    label: string,
  ) {
    return (
      <label className="field">
        {label}
        <input
          value={draft[key] ?? ""}
          onChange={(e) => field(key, e.target.value)}
        />
      </label>
    );
  }
  async function uploadModel(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      field("model", await prepareModel(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Model okunamadı.");
    } finally {
      setBusy(false);
    }
  }
}
function PhotoPreview({
  photo,
  name,
  text,
}: {
  photo?: SitePhoto;
  name: string;
  text?: string;
}) {
  return (
    <div className="photo-preview">
      <div className="photo-preview-media">
        {photo ? (
          <img src={photo.src} alt={photo.alt} />
        ) : (
          <div className="empty-state">
            <ImagePlus size={38} />
            <p>Fotoğraf seçildiğinde burada görünür</p>
          </div>
        )}
      </div>
      <div className="photo-preview-copy">
        <h2>{name || "Yeni eser"}</h2>
        <p>{text || "Eserin anlatımı burada görünecek."}</p>
        {photo && (
          <small>
            {photo.title} · {photo.license} · {trustLabels[photo.trust]}
          </small>
        )}
      </div>
    </div>
  );
}
