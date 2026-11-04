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
  RotateCcw,
} from "lucide-react";
import {
  kindLabels,
  trustLabels,
  nightPartsMissing,
  partsMissing,
  type MissingPart,
  publicationIssues,
  type HeritageSite,
  type SiteModel,
  type SitePhoto,
  type SiteSource,
  type StoryBlock,
  type MapPlacement,
  type Trust,
} from "@akar/domain";
import { ApiError, routes, type AkarClient, type JobTarget } from "@akar/api-client";
import { Modal, Notice, Tag } from "./ui";
import { PhotoDialog } from "./admin-photo-dialog";
import { PartCardsStep } from "./admin-part-cards";
import { TasksStep } from "./admin-site-tasks";
import { AboutStep } from "./admin-site-about";
import { PlacementSection, usePlacementEditor } from "./admin-placement";
import { AdminModelPreview, poseSummary } from "./admin-model-preview";
import { prepareModel } from "../lib/editor-media";
import { translationLabels } from "../lib/translation-labels";
const steps = [
  "Model",
  "Bilgiler",
  "Kaynaklar",
  "Hikâye",
  "Parça kartları",
  "Görevler ve rozetler",
  "Eser hakkında",
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
  /** Records the voice-overs of the saved story and part card texts (`AkarClient.narrateSite`). */
  narrateSite: AkarClient["narrateSite"];
  /** Fills the empty English story and part card texts with a machine draft (`AkarClient.translateSite`). */
  translateSite: AkarClient["translateSite"];
  live: boolean;
}) {
  const [draft, setDraft] = useState(() => prepareSite(site));
  // The site as last saved (or opened): «Değişiklikleri geri al» goes back to it.
  const [savedDraft, setSavedDraft] = useState(draft),
    [reverting, setReverting] = useState(false);
  const [step, setStep] = useState(0),
    [activeStory, setActiveStory] = useState(0),
    [activeCard, setActiveCard] = useState(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const [photoTarget, setPhotoTarget] = useState<string>(),
    [photoEdit, setPhotoEdit] = useState<SitePhoto>();
  const [preview, setPreview] = useState(false),
    [closing, setClosing] = useState(false);
  // The right column: the 3D model (Model and Hikâye steps of a site with one) or the photo preview.
  const [aside, setAside] = useState<"3d" | "photo">("3d");
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
  const hasJobTexts = draft.stories.length > 0 || Boolean(draft.partCards?.length);
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
  /** Voice-over or translation of the whole site or one sentence or card; the editor then shows the site as the server has it. */
  async function runStoryJob(kind: "translate" | "narrate", target?: JobTarget) {
    setStoryJob(
      `${kind}:${!target ? "all" : "storyBlockId" in target ? target.storyBlockId : target.partCardId}`,
    );
    setStoryNote(null);
    try {
      const run =
        kind === "translate"
          ? await translateSite(draft.id, target)
          : await narrateSite(draft.id, target);
      const fresh = prepareSite(run.site);
      setDraft(fresh);
      setBaseline(siteKey(fresh));
      const text =
        "translated" in run
          ? `${run.translated} metnin İngilizcesi makine çevirisiyle dolduruldu, ${run.skipped} metne dokunulmadı. Çeviriyi gözden geçirip kaydedince "onaylı" olur.`
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
  // Checked on every render: a model swap shows at once which content points at parts the new file lacks.
  const modelMissing = draft.model ? partsMissing(draft, draft.model.parts) : [];
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
  /**
   * «Açıyı kaydet» writes to the server at once (Muhammed, 4 Nov 2026: «kaydediyorum ama hikâyede yansımıyor»): it only
   * changed the draft until the editor's own save, while the note already said «kaydedildi». A site not yet on the server
   * stays a draft. Nothing else in the draft waits behind it: the whole draft goes.
   */
  async function saveAngle(next: HeritageSite) {
    setDraft(next);
    if (!sites.some((s) => s.id === next.id)) return;
    setBusy(true);
    setError("");
    try {
      const canonical = await onSave(next);
      setDraft(canonical);
      setSavedDraft(canonical);
      setBaseline(siteKey(canonical));
    } catch (e) {
      setError(e instanceof Error ? `Açı kaydedilemedi: ${e.message}` : "Açı kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }
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
      setSavedDraft(canonical);
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
          {dirty && (
            <button className="btn secondary" onClick={() => setReverting(true)}>
              <RotateCcw size={16} />
              Değişiklikleri geri al
            </button>
          )}
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
                  <MissingParts missing={modelMissing} />
                  <NightModel
                    site={{ ...draft, model: draft.model }}
                    busy={busy}
                    onUpload={(file) => void uploadNightModel(file)}
                    onRemove={() => {
                      const { night: _night, ...day } = draft.model!;
                      field("model", day);
                    }}
                  />
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
                Sağdaki 3D önizlemede modeli döndür, «Açılış açısı olarak
                kaydet» ile eser sayfasındaki 3D'nin hangi açıyla açılacağını
                belirle. Ses dosyası bağlama sonraki aşamada.
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
                    disabled={!storyJobsReady || !hasJobTexts}
                    onClick={() => void runStoryJob("translate")}
                  >
                    {storyJob === "translate:all"
                      ? "Çevriliyor…"
                      : "İngilizceye çevir"}
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!storyJobsReady || !hasJobTexts}
                    onClick={() => void runStoryJob("narrate")}
                  >
                    {storyJob === "narrate:all" ? "Seslendiriliyor…" : "Seslendir"}
                  </button>
                </div>
                <small className="muted">
                  İşlem sunucudaki kayıtlı metinleri (hikâye cümleleri ve parça
                  kartları) kullanır: eserde kaydedilmemiş değişiklik varken
                  çalışmaz. Çeviri yalnız boş İngilizce alanları doldurur;
                  seslendirme yalnız eksik ya da metni değişmiş kayıtları üretir.
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
                  // A click anywhere on the sentence selects it: the 3D preview on the right shows its view.
                  onClick={() => setActiveStory(i)}
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
                      onClick={() => void runStoryJob("translate", { storyBlockId: s.id })}
                    >
                      {storyJob === `translate:${s.id}`
                        ? "Çevriliyor…"
                        : "İngilizceye çevir"}
                    </button>
                    <button
                      className="btn soft"
                      disabled={!storyJobsReady}
                      onClick={() => void runStoryJob("narrate", { storyBlockId: s.id })}
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
                  {draft.model && (
                    <p className="muted cue-angle">
                      3D: {s.camera ? poseSummary(s.camera) : "açı öncekinde kalır"}
                      {s.highlights?.length ? ` · vurgu: ${s.highlights.join(", ")}` : " · vurgu yok"}
                      {s.interior ? " · iç mekân" : ""}
                    </p>
                  )}
                  {(s.routeOnly || s.flow) && (
                    <p className="muted cue-angle">
                      {[s.routeOnly && "Yalnız rotada", s.flow && "Akar akışı var"].filter(Boolean).join(" · ")}
                    </p>
                  )}
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
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={s.routeOnly ?? false}
                        onChange={(e) =>
                          storyField(s.id, { routeOnly: e.target.checked || undefined })
                        }
                      />
                      Yalnız rotada
                    </label>
                    <small className="muted">
                      Eser bir rotadan açıldığında okunur (sonraki durağa
                      bağlayan cümle); haritadan açılınca atlanır.
                    </small>
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
                        <small className="muted">
                          Açı, vurgu ve iç mekân sağdaki 3D'de ayarlanır:
                          cümleyi seç, modeli döndür, parçaya dokun,
                          gerekirse «İçini göster».
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
              active={activeCard}
              onActive={setActiveCard}
              job={storyJob}
              jobsReady={storyJobsReady}
              note={storyNote}
              onJob={(kind, partCardId) => void runStoryJob(kind, { partCardId })}
            />
          )}
          {step === 5 && (
            <TasksStep
              tasks={draft.tasks ?? []}
              badges={draft.badges ?? []}
              modelParts={draft.model?.parts}
              photos={photos}
              onChange={(tasks, badges) => {
                field("tasks", tasks);
                field("badges", badges);
              }}
            />
          )}
          {step === 6 && (
            <AboutStep
              chapters={draft.chapters ?? []}
              sections={draft.sections ?? []}
              sources={sources}
              onChange={(chapters, sections) => {
                field("chapters", chapters);
                field("sections", sections);
              }}
            />
          )}
          {step === 7 && (
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
                {modelMissing.length > 0 && (
                  <p>
                    <CircleAlert size={17} />
                    3D modelde içeriğin kullandığı {modelMissing.length} parça
                    yok; ayrıntı «3D model» adımında. Yayını engellemez.
                  </p>
                )}
                <p>
                  {sources.length} kaynak · {photos.length} fotoğraf ·{" "}
                  {draft.stories.length} cümle
                </p>
              </div>
              {(!draft.nameEn ||
                !draft.descriptionEn ||
                draft.stories.some((s) => !s.textEn) ||
                draft.partCards?.some((c) => !c.bodyEn)) && (
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
          {draft.model && (step === 0 || step === 3 || step === 4) ? (
            <div className="row between editor-preview-head">
              <h3>{aside === "3d" ? "3D önizleme" : "Önizleme"}</h3>
              <div className="segmented" role="group" aria-label="Önizleme">
                <button className={aside === "3d" ? "active" : ""} aria-pressed={aside === "3d"} onClick={() => setAside("3d")}>
                  3D
                </button>
                <button className={aside === "photo" ? "active" : ""} aria-pressed={aside === "photo"} onClick={() => setAside("photo")}>
                  Fotoğraf
                </button>
              </div>
            </div>
          ) : (
            <h3>Önizleme</h3>
          )}
          {draft.model && (step === 0 || step === 3 || step === 4) && aside === "3d" ? (
            <AdminModelPreview
              // Each step starts its own preview: the last step's note and view do not carry over.
              key={`${draft.model.src}:${step}`}
              site={draft}
              {...(step === 3 && story && {
                story,
                storyIndex: activeStory,
                onStory: (patch: Pick<StoryBlock, "camera" | "highlights" | "interior" | "showCard">) =>
                  void saveAngle({ ...draft, stories: draft.stories.map((s) => (s.id === story.id ? { ...s, ...patch } : s)) }),
              })}
              {...(step === 4 && {
                card: draft.partCards?.[activeCard],
                cardIndex: activeCard,
                onCardParts: (parts: string[]) =>
                  field(
                    "partCards",
                    (draft.partCards ?? []).map((c, i) => (i === activeCard ? { ...c, parts } : c)),
                  ),
                onNewCard: (parts: string[]) => {
                  const cards = draft.partCards ?? [];
                  const id = crypto.randomUUID();
                  field("partCards", [
                    ...cards,
                    {
                      id,
                      parts,
                      title: "",
                      body: "",
                      photos: [],
                      sourceId: sources[0]?.id,
                      trust: "representative",
                    },
                  ]);
                  setActiveCard(cards.length);
                  // The new card is at the end of the list: bring it into view, its title first to fill in.
                  setTimeout(() => {
                    const card = document.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
                    card?.scrollIntoView({ behavior: "smooth", block: "start" });
                    card?.querySelector("input")?.focus({ preventScroll: true });
                  }, 50);
                },
              })}
              {...(step === 0 && {
                onOpening: (pose) => field("openingCamera", pose),
                onPhotoCamera: (photoId, camera) =>
                  void saveAngle({
                    ...draft,
                    photos: photos.map((p) => {
                      if (p.id !== photoId) return p;
                      const { camera: _old, ...rest } = p;
                      return camera ? { ...rest, camera } : rest;
                    }),
                  }),
              })}
            />
          ) : (
          <>
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
          </>
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
      {reverting && (
        <Modal title="Değişiklikleri geri al" onClose={() => setReverting(false)}>
          <p>
            Son kayıttan bu yana yaptığın bütün değişiklikler (açılar ve harita
            yerleşimi dahil) silinir; eser son kaydedilen hâline döner.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setReverting(false)}>
              Vazgeç
            </button>
            <button
              className="btn"
              onClick={() => {
                setDraft(savedDraft);
                placement.revert();
                setActiveStory(0);
                setError("");
                setSaved("Değişiklikler geri alındı.");
                setReverting(false);
              }}
            >
              Geri al
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
            <button className="btn secondary" onClick={() => setClosing(false)}>
              Vazgeç, düzenlemeye dön
            </button>
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
      const model = await prepareModel(file);
      // A new day file keeps the night one: the part names are compared below the upload.
      field("model", draft.model?.night ? { ...model, night: draft.model.night } : model);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Model okunamadı.");
    } finally {
      setBusy(false);
    }
  }
  async function uploadNightModel(file?: File) {
    if (!file || !draft.model) return;
    setBusy(true);
    setError("");
    try {
      const { name, bytes, src, parts, triangles } = await prepareModel(file);
      field("model", {
        ...draft.model,
        night: { name, bytes, src, parts, ...(triangles !== undefined && { triangles }) },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gece modeli okunamadı.");
    } finally {
      setBusy(false);
    }
  }
}
/**
 * Adım 1, gece modeli: the night theme's file of the same model. Optional; without it the night shows the day model.
 * Its part names should be the day model's, as highlights, part cards and tasks name them.
 */
function NightModel({
  site,
  busy,
  onUpload,
  onRemove,
}: {
  site: HeritageSite & { model: SiteModel };
  busy: boolean;
  onUpload: (file?: File) => void;
  onRemove: () => void;
}) {
  const { model } = site;
  const missing = nightPartsMissing(site);
  return (
    <section className="editor-night-model">
      <h3>Gece modeli</h3>
      <p className="muted">
        İsteğe bağlı. Gece temasında bu dosya gösterilir; yoksa gece de gündüz
        modeli görünür. Parça adları gündüz modeliyle aynı olmalı: hikâye
        vurguları, parça kartları ve görevler bu adlarla çalışır.
      </p>
      {model.night && (
        <div className="row between">
          <Tag>
            {model.night.name}
            {model.night.bytes > 0 &&
              ` · ${(model.night.bytes / 1024 / 1024).toFixed(2)} MB`}{" "}
            · {model.night.parts.length} parça
          </Tag>
          <button className="btn secondary" onClick={onRemove}>
            Gece modelini kaldır
          </button>
        </div>
      )}
      <label className="field">
        {model.night ? "Gece modelini değiştir" : "Gece modeli dosyası"}
        <input
          type="file"
          accept=".glb"
          disabled={busy}
          onChange={(e) => {
            onUpload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {missing.length > 0 && (
        <Notice>
          Gece modelinde içeriğin kullandığı şu parçalar yok: {missing.join(", ")}.
          Bu parçalardaki vurgu, kart ve görevler gece temasında görünmez.
        </Notice>
      )}
    </section>
  );
}
/** Adım 1: content that names parts the day model lacks; these highlights, cards and tasks find nothing to show. */
function MissingParts({ missing }: { missing: MissingPart[] }) {
  if (!missing.length) return null;
  return (
    <Notice>
      Modelde içeriğin kullandığı şu parçalar yok; ilgili yerleri yeni
      parça adlarıyla güncelle:
      <ul>
        {missing.map((m) => (
          <li key={m.part}>
            <strong>{m.part}</strong>: {m.usedIn.join(", ")}
          </li>
        ))}
      </ul>
    </Notice>
  );
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
