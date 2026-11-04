"use client";
import { useEffect, useMemo, useState } from "react";
import type {
  AkarClient,
  SiteUsageStats,
  UsageCount,
  UsageStats,
} from "@akar/api-client";
import { USAGE_EVENTS, usageEventNames, type UsageEventName } from "@akar/domain";
import { Notice } from "./ui";
import { describeError } from "../lib/errors";
import {
  dailySeries,
  lastDays,
  sentenceFunnel,
  total,
  type Split,
} from "../lib/usage-stats";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

/** Summary cards, in this order. */
const CARDS: UsageEventName[] = [
  "app.open",
  "site.view",
  "story.start",
  "story.complete",
  "narration.play",
  "task.complete",
  "my_route.add",
  "account.sign_in",
];

/** Columns of the sites table. */
const SITE_COLUMNS: Array<{ event: UsageEventName; label: string }> = [
  { event: "site.view", label: "Görüntüleme" },
  { event: "story.start", label: "Hikâye başlatma" },
  { event: "story.complete", label: "Hikâye bitirme" },
  { event: "narration.play", label: "Seslendirme" },
  { event: "about.open", label: "Eser hakkında" },
  { event: "history.open", label: "Geçmişi gör" },
  { event: "part_card.open", label: "Parça kartı" },
  { event: "task.complete", label: "Görev" },
  { event: "my_route.add", label: "Rotama ekleme" },
];

const number = new Intl.NumberFormat("tr-TR");
const percent = new Intl.NumberFormat("tr-TR", { style: "percent" });
const dayLabel = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatDay = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));

/** Admin only: anonymous daily usage counters (§11.72). */
export function AdminStats({
  loadStats,
  loadSiteStats,
  live,
}: {
  loadStats: AkarClient["getUsageStats"];
  loadSiteStats: AkarClient["getSiteUsageStats"];
  live: boolean;
}) {
  const [period, setPeriod] = useState<Period>(30);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [siteId, setSiteId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setError("");
    loadStats(lastDays(period, new Date())).then(
      (next) => !cancelled && setStats(next),
      (e) => !cancelled && setError(describeError(e, "İstatistikler yüklenemedi.")),
    );
    return () => {
      cancelled = true;
    };
  }, [loadStats, period, revision]);
  const site = siteId ? stats?.sites.find((s) => s.siteId === siteId) : undefined;
  return (
    <section className="admin-main admin-stats">
      <div className="row between">
        <div>
          <small className="eyebrow">KULLANIM</small>
          <h1>İstatistikler</h1>
        </div>
        <div className="segmented" role="group" aria-label="Dönem">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={p === period ? "active" : ""}
              aria-pressed={p === period}
              onClick={() => setPeriod(p)}
            >
              Son {p} gün
            </button>
          ))}
        </div>
      </div>
      <p>
        Günlük anonim sayaçlar: kimlik, IP, cihaz ya da saat tutulmaz, tekil
        ziyaretçi sayılmaz. Günler İstanbul saatine göredir.
      </p>
      {!live && <Notice>Demo paneli. Demo kullanım saymaz; tablolar boştur.</Notice>}
      {error && (
        <div role="alert">
          <p className="error">{error}</p>
          <button className="btn secondary" onClick={() => setRevision((r) => r + 1)}>
            Yeniden dene
          </button>
        </div>
      )}
      {!stats && !error && <p role="status">İstatistikler yükleniyor…</p>}
      {stats &&
        (siteId ? (
          <SiteDetail
            key={`${siteId}:${stats.from}:${stats.to}`}
            siteId={siteId}
            totals={site?.counts ?? []}
            range={{ from: stats.from, to: stats.to }}
            load={loadSiteStats}
            onBack={() => setSiteId(null)}
          />
        ) : (
          <Overview stats={stats} onSite={setSiteId} />
        ))}
    </section>
  );
}

function SplitText({ guest, signedIn }: Split) {
  return (
    <small className="stats-split">
      Misafir {number.format(guest)} · Üye {number.format(signedIn)}
    </small>
  );
}

function Overview({
  stats,
  onSite,
}: {
  stats: UsageStats;
  onSite: (siteId: string) => void;
}) {
  const [metric, setMetric] = useState<UsageEventName>("app.open");
  const [sort, setSort] = useState<{ key: UsageEventName | "name"; desc: boolean }>({
    key: "site.view",
    desc: true,
  });
  const series = useMemo(() => dailySeries(stats, metric), [stats, metric]);
  const sites = useMemo(() => {
    const dir = sort.desc ? -1 : 1;
    return [...stats.sites].sort((a, b) =>
      sort.key === "name"
        ? dir * (a.name ?? a.siteId).localeCompare(b.name ?? b.siteId, "tr")
        : dir * (total(a.counts, sort.key) - total(b.counts, sort.key)),
    );
  }, [stats.sites, sort]);
  const orderBy = (key: UsageEventName | "name") =>
    setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" }));
  const ariaSort = (key: UsageEventName | "name") =>
    sort.key === key ? (sort.desc ? "descending" : "ascending") : undefined;
  const cardOf = (event: UsageEventName): Split =>
    stats.totals.find((t) => t.event === event) ?? { guest: 0, signedIn: 0 };
  return (
    <>
      <div className="stats-cards">
        {CARDS.map((event) => {
          const c = cardOf(event);
          return (
            <div className="stats-card" key={event}>
              <span>{USAGE_EVENTS[event].label}</span>
              <strong>{number.format(c.guest + c.signedIn)}</strong>
              <SplitText {...c} />
            </div>
          );
        })}
      </div>

      <h2>Günlük</h2>
      <label className="field stats-metric">
        Gösterilen olay
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as UsageEventName)}
        >
          {usageEventNames.map((event) => (
            <option key={event} value={event}>
              {USAGE_EVENTS[event].label}
            </option>
          ))}
        </select>
      </label>
      <DailyChart series={series} label={USAGE_EVENTS[metric].label} />

      <h2>Eserler</h2>
      {sites.length === 0 ? (
        <Notice>Bu dönemde eser olayı yok.</Notice>
      ) : (
        <div className="table-wrap">
          <table className="stats-table">
            <caption className="sr-only">
              Eser başına olaylar; sıralamak için sütun başlığına, ayrıntı için esere bas.
            </caption>
            <thead>
              <tr>
                <th aria-sort={ariaSort("name")}>
                  <button onClick={() => orderBy("name")}>Eser</button>
                </th>
                {SITE_COLUMNS.map((c) => (
                  <th key={c.event} aria-sort={ariaSort(c.event)}>
                    <button onClick={() => orderBy(c.event)}>{c.label}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.siteId}>
                  <td>
                    <button onClick={() => onSite(s.siteId)}>
                      {s.name ?? `Silinmiş eser (${s.siteId})`}
                    </button>
                  </td>
                  {SITE_COLUMNS.map((c) => (
                    <td key={c.event}>{number.format(total(s.counts, c.event))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Rotalar</h2>
      {stats.routes.length === 0 ? (
        <Notice>Bu dönemde rota açılmadı.</Notice>
      ) : (
        <div className="table-wrap">
          <table className="stats-table">
            <caption className="sr-only">Rota açılışları</caption>
            <thead>
              <tr>
                <th>Rota</th>
                <th>Açılış</th>
                <th>Misafir</th>
                <th>Üye</th>
              </tr>
            </thead>
            <tbody>
              {stats.routes.map((r) => (
                <tr key={r.routeId}>
                  <td>{r.name ?? `Silinmiş rota (${r.routeId})`}</td>
                  <td>{number.format(r.guest + r.signedIn)}</td>
                  <td>{number.format(r.guest)}</td>
                  <td>{number.format(r.signedIn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function DailyChart({
  series,
  label,
}: {
  series: Array<Split & { day: string }>;
  label: string;
}) {
  const max = Math.max(1, ...series.map((d) => d.guest + d.signedIn));
  const W = 12;
  const H = 120;
  const sum = series.reduce((n, d) => n + d.guest + d.signedIn, 0);
  return (
    <figure className="stats-chart">
      <svg
        viewBox={`0 0 ${series.length * W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: dönemde ${number.format(sum)}, günlük en çok ${number.format(max)}`}
      >
        {series.map((d, i) => {
          const g = (d.guest / max) * H;
          const s = (d.signedIn / max) * H;
          return (
            <g key={d.day}>
              <title>
                {`${formatDay(d.day)}: ${number.format(d.guest + d.signedIn)} (misafir ${d.guest}, üye ${d.signedIn})`}
              </title>
              <rect className="guest" x={i * W + 1} width={W - 2} y={H - g} height={g} />
              <rect className="member" x={i * W + 1} width={W - 2} y={H - g - s} height={s} />
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span>{series[0] && formatDay(series[0].day)}</span>
        <span className="stats-legend">
          <i className="guest" /> Misafir <i className="member" /> Üye
        </span>
        <span>{series.at(-1) && formatDay(series.at(-1)!.day)}</span>
      </figcaption>
    </figure>
  );
}

function SiteDetail({
  siteId,
  totals,
  range,
  load,
  onBack,
}: {
  siteId: string;
  totals: UsageCount[];
  range: { from: string; to: string };
  load: AkarClient["getSiteUsageStats"];
  onBack: () => void;
}) {
  const [data, setData] = useState<SiteUsageStats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    load(siteId, range).then(
      (next) => !cancelled && setData(next),
      (e) => !cancelled && setError(describeError(e, "Eser istatistikleri yüklenemedi.")),
    );
    return () => {
      cancelled = true;
    };
    // `range` is a new object each render; its values are in the parent's `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, siteId]);
  const funnel = data ? sentenceFunnel(data.rows) : [];
  const rowsOf = (event: UsageEventName) =>
    (data?.rows ?? [])
      .filter((r) => r.event === event)
      .sort((a, b) => b.guest + b.signedIn - (a.guest + a.signedIn));
  const cards = rowsOf("part_card.open");
  const tasks = rowsOf("task.complete");
  const voices = rowsOf("narration.play");
  return (
    <div className="stats-site">
      <button className="btn secondary" onClick={onBack}>
        ← Tüm eserler
      </button>
      <h2>{data?.name ?? siteId}</h2>
      <p>
        Hikâye başlatma {number.format(total(totals, "story.start"))} · bitirme{" "}
        {number.format(total(totals, "story.complete"))} · görüntüleme{" "}
        {number.format(total(totals, "site.view"))}
      </p>
      {error && <p className="error" role="alert">{error}</p>}
      {!data && !error && <p role="status">Yükleniyor…</p>}
      {data && (
        <>
          <h3>Hikâye cümleleri</h3>
          {funnel.length === 0 ? (
            <Notice>Bu dönemde hikâye cümlesine ulaşılmadı.</Notice>
          ) : (
            <ol className="stats-funnel" aria-label="Cümleye ulaşan ziyaretçi sayısı">
              {funnel.map((f) => (
                <li key={f.index}>
                  <span>{f.index + 1}. cümle</span>
                  <meter min={0} max={1} value={f.share ?? 0} />
                  <span>
                    {number.format(f.count)}
                    {f.share !== null && ` (${percent.format(f.share)})`}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <RefTable title="Parça kartları" empty="Bu dönemde parça kartı açılmadı." rows={cards} />
          <RefTable title="Görevler" empty="Bu dönemde görev tamamlanmadı." rows={tasks} />
          <RefTable
            title="Seslendirme dili"
            empty="Bu dönemde seslendirme dinlenmedi."
            rows={voices.map((v) => ({
              ...v,
              label: v.ref === "tr" ? "Türkçe" : v.ref === "en" ? "İngilizce" : v.ref,
            }))}
          />
        </>
      )}
    </div>
  );
}

function RefTable({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<Split & { ref: string; label: string | null }>;
}) {
  return (
    <>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <Notice>{empty}</Notice>
      ) : (
        <div className="table-wrap">
          <table className="stats-table">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th>Ad</th>
                <th>Toplam</th>
                <th>Misafir</th>
                <th>Üye</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ref}>
                  <td>{r.label ?? r.ref}</td>
                  <td>{number.format(r.guest + r.signedIn)}</td>
                  <td>{number.format(r.guest)}</td>
                  <td>{number.format(r.signedIn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
