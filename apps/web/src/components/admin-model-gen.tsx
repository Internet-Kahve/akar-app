"use client";
import { useEffect, useState } from "react";
import { Sparkles, Send, Download } from "lucide-react";
import { ApiError, type AkarClient, type ModelGenJob, type ModelGenStatus } from "@akar/api-client";
import { describeError } from "../lib/errors";
import { Notice, Tag } from "./ui";

/** The four model-gen calls of `AkarClient`, as the panel uses them. */
export type ModelGenApi = {
  status: AkarClient["getModelGenStatus"];
  start: AkarClient["startModelGenJob"];
  list: AkarClient["listModelGenJobs"];
  get: AkarClient["getModelGenJob"];
};

const MAX_PROMPT = 4000;
const POLL_MS = 2000;

const statusLabel: Record<ModelGenJob["status"], string> = {
  running: "Çalışıyor",
  succeeded: "Tamamlandı",
  failed: "Başarısız",
  lost: "Yarıda kaldı",
};

function jobError(e: unknown): string {
  if (e instanceof ApiError && e.code === "MODEL_GEN_BUSY") return "Çalıştırıcı başka bir işi bitiriyor; biraz sonra tekrar dene.";
  if (e instanceof ApiError && e.code === "MODEL_GEN_DISABLED") return "Model çalıştırıcı yapılandırılmamış.";
  if (e instanceof ApiError && e.status === 502) return "Model çalıştırıcıya ulaşılamadı.";
  return describeError(e, "İstek gönderilemedi.");
}

/**
 * Adım 0, «3D üret»: the admin asks for a model change in plain words; the runner edits the Blender file and exports
 * a preview. «Taslağa al» puts the chosen GLB into the draft like an uploaded file; saving the site publishes it.
 */
export function ModelGenPanel({
  api,
  siteId,
  saved,
  busy,
  onUse,
}: {
  api: ModelGenApi;
  siteId: string;
  /** The server has the site: the runner works on the server's site id. */
  saved: boolean;
  busy: boolean;
  onUse: (file: File) => Promise<void>;
}) {
  const [status, setStatus] = useState<ModelGenStatus | null>(null),
    [loadError, setLoadError] = useState("");
  const [history, setHistory] = useState<ModelGenJob[]>([]),
    [job, setJob] = useState<ModelGenJob | null>(null);
  const [prompt, setPrompt] = useState(""),
    [newSession, setNewSession] = useState(false),
    [sending, setSending] = useState(false),
    [error, setError] = useState(""),
    [using, setUsing] = useState<string | null>(null);

  useEffect(() => {
    if (!saved) return;
    let cancelled = false;
    Promise.all([api.status(), api.list(siteId)])
      .then(([s, page]) => {
        if (cancelled) return;
        setStatus(s);
        setHistory(page.items);
        const running = page.items.find((j) => j.status === "running");
        if (running) setJob(running);
      })
      .catch((e) => !cancelled && setLoadError(describeError(e, "Model üretimi durumu alınamadı.")));
    return () => {
      cancelled = true;
    };
  }, [api, siteId, saved]);

  // A running job is read again every two seconds: its live events, then the result with fresh file links.
  const runningId = job?.status === "running" ? job.id : null;
  useEffect(() => {
    if (!runningId) return;
    let cancelled = false,
      timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const fresh = await api.get(runningId);
        if (cancelled) return;
        setJob(fresh);
        if (fresh.status !== "running") {
          setHistory((h) => [fresh, ...h.filter((j) => j.id !== fresh.id)]);
          return;
        }
      } catch (e) {
        if (cancelled) return;
        setError(describeError(e, "İşin durumu alınamadı; yeniden deneniyor."));
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, runningId]);

  async function send() {
    const text = prompt.trim();
    if (!text) return;
    setSending(true);
    setError("");
    try {
      const started = await api.start(siteId, { prompt: text, ...(newSession && { newSession }) });
      setJob(started);
      setHistory((h) => [started, ...h]);
      setPrompt("");
      setNewSession(false);
    } catch (e) {
      setError(jobError(e));
    } finally {
      setSending(false);
    }
  }

  /** The signed link expires in 15 minutes; an old job is read again for a fresh one. */
  async function use(name: string) {
    if (!job) return;
    setUsing(name);
    setError("");
    try {
      const fresh = job.files.some((f) => f.name === name && f.url) ? job : await api.get(job.id);
      const url = fresh.files.find((f) => f.name === name)?.url;
      if (!url) throw new Error("Bu modelin dosyası çalıştırıcıda artık yok.");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Model dosyası indirilemedi.");
      await onUse(new File([await res.blob()], name, { type: "model/gltf-binary" }));
    } catch (e) {
      setError(describeError(e, "Model dosyası indirilemedi."));
    } finally {
      setUsing(null);
    }
  }

  const header = (
    <>
      <h3>
        <Sparkles size={17} /> 3D üret
      </h3>
      <p className="muted">
        Modelde ne değişsin, yaz: çalıştırıcı Blender dosyasını düzenler, önizleme modelini çıkarır. Beğendiğin sonucu
        «Taslağa al» ile modele koy, eseri kaydedince yayına girer.
      </p>
    </>
  );
  if (!saved)
    return (
      <section className="model-gen">
        {header}
        <Notice>Önce eseri kaydet; model üretimi sunucudaki eser üzerinde çalışır.</Notice>
      </section>
    );
  if (loadError)
    return (
      <section className="model-gen">
        {header}
        <p className="error" role="alert">
          {loadError}
        </p>
      </section>
    );
  if (!status)
    return (
      <section className="model-gen" aria-busy="true">
        {header}
        <p role="status">Model üretimi durumu alınıyor…</p>
      </section>
    );
  if (!status.enabled || !status.loggedIn)
    return (
      <section className="model-gen">
        {header}
        <Notice>
          {!status.enabled
            ? "Model çalıştırıcı bu sistemde yapılandırılmamış."
            : "Çalıştırıcıdaki Claude hesabının oturumu kapalı; sunucuda yeniden giriş yapılmalı."}
        </Notice>
      </section>
    );

  const running = job?.status === "running";
  return (
    <section className="model-gen">
      {header}
      <label className="field">
        İstek
        <textarea
          rows={3}
          maxLength={MAX_PROMPT}
          value={prompt}
          disabled={running || sending}
          placeholder="Örnek: Kubbeyi yüzde 10 yükselt."
          onChange={(e) => setPrompt(e.target.value)}
        />
      </label>
      <div className="row between">
        <label className="checkbox-label">
          <input type="checkbox" checked={newSession} disabled={running || sending} onChange={(e) => setNewSession(e.target.checked)} />
          Yeni sohbet başlat (önceki istekleri unut)
        </label>
        <button className="btn" disabled={running || sending || !prompt.trim()} onClick={() => void send()}>
          <Send size={16} />
          {sending ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {job && (
        <div className="model-gen-job" aria-live="polite">
          <div className="row between">
            <strong>{job.prompt}</strong>
            <Tag tone={job.status === "succeeded" ? "success" : "muted"}>
              {statusLabel[job.status]}
              {job.version && ` · ${job.version}`}
            </Tag>
          </div>
          {job.events.length > 0 && (
            <ol className="model-gen-events">
              {job.events.map((ev, i) =>
                ev.type === "text" ? (
                  <li key={i}>{ev.text}</li>
                ) : ev.type === "tool" ? (
                  <li key={i} className="muted">
                    Blender: {ev.summary || ev.name}
                  </li>
                ) : ev.type === "export" ? (
                  <li key={i} className="muted">
                    Önizleme modeli çıkarılıyor…
                  </li>
                ) : null,
              )}
            </ol>
          )}
          {running && <p role="status">Çalışıyor… İlk sonuç genelde yarım dakika sürer.</p>}
          {/* The reply is the last text event of a live job; a job from the history has no events. */}
          {job.status === "succeeded" && job.reply && !job.events.some((ev) => ev.type === "text" && ev.text === job.reply) && (
            <p>{job.reply}</p>
          )}
          {(job.status === "failed" || job.status === "lost") && (
            <p className="error" role="alert">
              {job.status === "lost" ? "Çalıştırıcı yeniden başladı, iş yarıda kaldı." : job.error || "İş başarısız oldu."}
            </p>
          )}
          {job.warnings.length > 0 && (
            <ul className="model-gen-warnings">
              {job.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          {job.status === "succeeded" &&
            job.files.map((f) => (
              <div key={f.name} className="row between">
                <span>
                  {f.name} · {(f.bytes / 1024).toFixed(0)} KB
                </span>
                <button className="btn secondary" disabled={busy || using !== null} onClick={() => void use(f.name)}>
                  <Download size={16} />
                  {using === f.name ? "Alınıyor…" : "Taslağa al"}
                </button>
              </div>
            ))}
          {job.usage && (
            <small className="muted">
              {job.usage.turns} adım · {Math.round(job.usage.durationMs / 1000)} sn
            </small>
          )}
        </div>
      )}
      {history.length > 0 && (
        <details className="model-gen-history">
          <summary>Önceki istekler ({history.length})</summary>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                <button className="text-btn" onClick={() => setJob(h)} disabled={running}>
                  {h.prompt}
                </button>{" "}
                <small className="muted">
                  {statusLabel[h.status]}
                  {h.version && ` · ${h.version}`} · {new Date(h.createdAt).toLocaleString("tr-TR")}
                </small>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
