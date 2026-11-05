"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import type { SiteProgress } from "@akar/api-client";
import { badgeArt, badgeEntries, type AchievementId, type BadgeEntry, type BadgeTier } from "../lib/badges";
import { badgesThisWeek, CARD_HEIGHT, CARD_WIDTH, istanbulWeekStart, shareFileName, weekRange, wrapLines } from "../lib/share-card";
import { canShareFile, downloadFile, shareFile } from "../lib/share-file";
import { badgeInLang } from "../lib/task-text";
import { useAvatar } from "./avatar";
import { ACHIEVEMENT_ICONS } from "./badge-medal";
import { useI18n } from "./i18n";
import { Modal } from "./ui";

/** What the visitor asked to share. */
export type ShareRequest = { kind: "badge"; entry: BadgeEntry } | { kind: "achievement"; id: AchievementId } | { kind: "week" };

type Art =
  | { kind: "medal"; src: string; tier: BadgeTier }
  | { kind: "icon"; svg: string }
  | { kind: "medals"; items: Array<{ src: string; tier: BadgeTier }>; more: number };
interface CardSpec {
  file: string;
  kicker: string;
  title: string;
  subtitle?: string | undefined;
  chip?: { label: string; tier: BadgeTier } | undefined;
  art: Art;
  person: { name: string; avatarSrc: string; colour: string };
  score: string;
  footer: string;
}

const METAL: Record<BadgeTier, [string, string, string]> = {
  bronze: ["#e7a56b", "#9a5a2a", "#6b3a17"],
  silver: ["#f4f7fa", "#a9b6c3", "#5f6f80"],
  gold: ["#ffe9a3", "#e6b53c", "#9a6a12"],
};
const INK = "#2b1d14";
const DISPLAY = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The achievement's icon, already rendered (hidden) in the dialog, as SVG markup to draw on the canvas. */
function iconSvg(host: HTMLElement | null): string {
  const svg = host?.querySelector("svg");
  if (!svg) return "";
  const copy = svg.cloneNode(true) as SVGElement;
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return copy.outerHTML;
}

function metalDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tier: BadgeTier) {
  const [a, b, c] = METAL[tier];
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const fill =
    "createConicGradient" in ctx
      ? (() => {
          const g = ctx.createConicGradient(-2.2, x, y);
          [c, a, b, c, a, c].forEach((col, i, all) => g.addColorStop(i / (all.length - 1), col));
          return g;
        })()
      : (() => {
          const g = (ctx as CanvasRenderingContext2D).createLinearGradient(x - r, y - r, x + r, y + r);
          g.addColorStop(0, a);
          g.addColorStop(0.5, b);
          g.addColorStop(1, c);
          return g;
        })();
  ctx.fillStyle = fill;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = r * 0.18;
  ctx.shadowOffsetY = r * 0.06;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(6, r * 0.04);
  ctx.strokeStyle = INK;
  ctx.stroke();
  const shine = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 0.7);
  shine.addColorStop(0, "rgba(255,255,255,0.55)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The 1080 × 1920 card. */
async function drawCard(spec: CardSpec): Promise<Blob> {
  await Promise.all([
    document.fonts?.load(`600 110px ${DISPLAY}`),
    document.fonts?.load(`700 44px ${SANS}`),
    document.fonts?.load(`500 40px ${SANS}`),
  ]).catch(() => undefined);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const cx = CARD_WIDTH / 2,
    my = 800;

  // Ground: warm dark, light from the medal.
  const ground = ctx.createRadialGradient(cx, my, 40, cx, my, 1300);
  ground.addColorStop(0, "#7a521c");
  ground.addColorStop(0.45, "#2e1d0d");
  ground.addColorStop(1, "#120b05");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  // Rays.
  const rays = ctx.createRadialGradient(cx, my, 0, cx, my, 900);
  rays.addColorStop(0, "rgba(255, 206, 92, 0.34)");
  rays.addColorStop(1, "rgba(255, 206, 92, 0)");
  ctx.fillStyle = rays;
  for (let i = 0; i < 36; i += 2) {
    const a0 = (i * Math.PI) / 18,
      a1 = ((i + 1) * Math.PI) / 18;
    ctx.beginPath();
    ctx.moveTo(cx, my);
    ctx.arc(cx, my, 1400, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  // Gilded frame with a row of dots.
  ctx.save();
  ctx.strokeStyle = "#d9a93a";
  ctx.lineWidth = 6;
  roundRect(ctx, 36, 36, CARD_WIDTH - 72, CARD_HEIGHT - 72, 44);
  ctx.stroke();
  ctx.setLineDash([0.1, 20]);
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255, 214, 120, 0.8)";
  roundRect(ctx, 58, 58, CARD_WIDTH - 116, CARD_HEIGHT - 116, 30);
  ctx.stroke();
  ctx.restore();

  // Logo, in white.
  const logo = await loadImage("/logo/logo-web.png");
  if (logo) {
    const w = 300,
      h = (logo.height / logo.width) * w;
    const tint = document.createElement("canvas");
    tint.width = w;
    tint.height = h;
    const t = tint.getContext("2d")!;
    t.drawImage(logo, 0, 0, w, h);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = "#fff8ea";
    t.fillRect(0, 0, w, h);
    ctx.drawImage(tint, cx - w / 2, 130);
  }

  // The art.
  const art = spec.art;
  if (art.kind === "medal") {
    metalDisc(ctx, cx, my, 330, art.tier);
    const img = await loadImage(art.src);
    if (img) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 16;
      ctx.drawImage(img, cx - 300, my - 300, 600, 600);
      ctx.restore();
    }
  } else if (art.kind === "icon") {
    metalDisc(ctx, cx, my, 320, "gold");
    ctx.beginPath();
    ctx.arc(cx, my, 260, 0, Math.PI * 2);
    const coin = ctx.createRadialGradient(cx - 90, my - 100, 20, cx, my, 270);
    coin.addColorStop(0, "#fff1bf");
    coin.addColorStop(0.5, "#ecc055");
    coin.addColorStop(1, "#b8861f");
    ctx.fillStyle = coin;
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = INK;
    ctx.stroke();
    const icon = art.svg && await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(art.svg)}`);
    if (icon && art.svg) ctx.drawImage(icon, cx - 120, my - 120, 240, 240);
  } else {
    const n = art.items.length;
    const gap = 300,
      x0 = cx - ((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const item = art.items[i]!;
      const x = x0 + i * gap,
        y = my + (n === 3 && i !== 1 ? 60 : 0);
      metalDisc(ctx, x, y, 145, item.tier);
      const img = await loadImage(item.src);
      if (img) ctx.drawImage(img, x - 132, y - 132, 264, 264);
    }
    if (art.more > 0) {
      ctx.fillStyle = "#ffd56b";
      ctx.font = `700 56px ${SANS}`;
      ctx.textAlign = "center";
      ctx.fillText(`+${art.more}`, cx, my + 300);
    }
  }

  // Words.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffd56b";
  ctx.font = `700 42px ${SANS}`;
  ctx.fillText(spec.kicker.toLocaleUpperCase(), cx, 1250);
  ctx.fillStyle = "#fff8ea";
  ctx.font = `600 104px ${DISPLAY}`;
  const lines = wrapLines(spec.title, 900, 2, (s) => ctx.measureText(s).width);
  lines.forEach((line, i) => ctx.fillText(line, cx, 1360 + i * 108));
  let y = 1360 + lines.length * 108 - 20;
  if (spec.subtitle) {
    ctx.font = `500 42px ${SANS}`;
    ctx.fillStyle = "rgba(255, 248, 234, 0.85)";
    ctx.fillText(wrapLines(spec.subtitle, 900, 1, (s) => ctx.measureText(s).width)[0] ?? "", cx, y + 30);
    y += 60;
  }
  if (spec.chip) {
    const [a, b] = METAL[spec.chip.tier];
    ctx.font = `700 34px ${SANS}`;
    const label = spec.chip.label.toLocaleUpperCase();
    const w = ctx.measureText(label).width + 64;
    const g = ctx.createLinearGradient(0, y + 20, 0, y + 80);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    roundRect(ctx, cx - w / 2, y + 20, w, 60, 30);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = spec.chip.tier === "silver" ? "#26313c" : "#3b2410";
    ctx.fillText(label, cx, y + 62);
  }

  // The visitor: figure, name, score.
  ctx.save();
  roundRect(ctx, 90, 1590, 900, 190, 95);
  ctx.fillStyle = "rgba(255, 248, 234, 0.1)";
  ctx.fill();
  ctx.restore();
  const avatar = await loadImage(spec.person.avatarSrc);
  ctx.save();
  ctx.beginPath();
  ctx.arc(185, 1685, 72, 0, Math.PI * 2);
  ctx.fillStyle = spec.person.colour;
  ctx.fill();
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 113, 1613, 144, 144);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(185, 1685, 72, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = spec.person.colour;
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff8ea";
  ctx.font = `600 54px ${DISPLAY}`;
  ctx.fillText(wrapLines(spec.person.name, 640, 1, (s) => ctx.measureText(s).width)[0] ?? "", 285, 1675);
  ctx.fillStyle = "#ffd56b";
  ctx.font = `600 38px ${SANS}`;
  ctx.fillText(spec.score, 285, 1730);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 248, 234, 0.6)";
  ctx.font = `500 30px ${SANS}`;
  ctx.fillText(spec.footer, cx, 1850);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}

/**
 * «Paylaş»: the story-sized card drawn here, shown as it will look, then the share sheet or a download. Loaded only
 * when the visitor asks to share.
 */
export default function ShareDialog({
  request,
  name,
  points,
  sites,
  progress,
  onClose,
}: {
  request: ShareRequest;
  name: string;
  points: number;
  sites: HeritageSite[];
  progress: SiteProgress;
  onClose: () => void;
}) {
  const { lang, t, text } = useI18n();
  const [figure] = useAvatar();
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState("");
  const iconHost = useRef<HTMLSpanElement>(null);
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  useEffect(() => {
    let live = true;
    const person = { name: name.trim() || t("share.guestName"), avatarSrc: `/avatarlar/${figure.id}.webp`, colour: figure.colour };
    const score = t("share.points", { points: new Intl.NumberFormat(lang === "en" ? "en-GB" : "tr-TR").format(points) });
    const footer = t("share.footer");
    let spec: CardSpec;
    if (request.kind === "badge") {
      const { badge } = badgeInLang(request.entry.badge, lang);
      spec = {
        file: shareFileName("rozet", badge.id),
        kicker: t("share.kickerBadge"),
        title: badge.title,
        subtitle: text(request.entry.site.name, request.entry.site.nameEn),
        chip: { label: t(`badge.tier.${request.entry.tier}`), tier: request.entry.tier },
        art: { kind: "medal", src: badgeArt(request.entry.badge), tier: request.entry.tier },
        person,
        score,
        footer,
      };
    } else if (request.kind === "achievement") {
      spec = {
        file: shareFileName("basarim", request.id),
        kicker: t("share.kickerAchievement"),
        title: t(`achievement.${request.id}.title`),
        art: { kind: "icon", svg: iconSvg(iconHost.current) },
        person,
        score,
        footer,
      };
    } else {
      const now = new Date();
      const week = badgesThisWeek(progress, now);
      const entries = badgeEntries(sites, progress);
      const items = week.flatMap((held) => {
        const e = entries.find((x) => x.badge.id === held.badgeId);
        return e ? [{ src: badgeArt(e.badge), tier: e.tier }] : [];
      });
      spec = {
        file: shareFileName("hafta", istanbulWeekStart(now).toISOString().slice(0, 10)),
        kicker: t("share.kickerWeek", { range: weekRange(now, lang) }),
        title: t("share.weekTitle", { count: week.length }),
        art: { kind: "medals", items: items.slice(0, 3), more: Math.max(0, items.length - 3) },
        person,
        score,
        footer,
      };
    }
    drawCard(spec).then(
      (blob) => live && setFile(new File([blob], spec.file, { type: "image/png" })),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
    // The card is drawn once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sharable = file ? canShareFile(file) : false;
  return (
    <Modal title={t("share.title")} onClose={onClose} className="share-dialog">
      {request.kind === "achievement" && (
        <span ref={iconHost} hidden>
          {(() => {
            const Icon = ACHIEVEMENT_ICONS[request.id];
            return <Icon size={240} strokeWidth={2.2} color="#5b3a10" />;
          })()}
        </span>
      )}
      <div className="share-preview" aria-busy={!file && !failed}>
        {file ? <img src={url} alt={t("share.previewAlt")} /> : <p className="muted">{failed ? t("share.failed") : t("share.preparing")}</p>}
      </div>
      {!sharable && file && <p className="muted share-note">{t("share.downloadNote")}</p>}
      {note && <p className="share-note" role="status">{note}</p>}
      <div className="share-actions">
        {sharable && (
          <button
            className="btn"
            disabled={!file}
            onClick={async () => {
              const outcome = await shareFile(file!, t("share.title"));
              if (outcome === "downloaded") setNote(t("share.downloaded"));
            }}
          >
            <Share2 size={18} aria-hidden="true" />
            {t("badge.share")}
          </button>
        )}
        <button
          className={`btn${sharable ? " secondary" : ""}`}
          disabled={!file}
          onClick={() => {
            downloadFile(file!);
            setNote(t("share.downloaded"));
          }}
        >
          <Download size={18} aria-hidden="true" />
          {t("share.download")}
        </button>
      </div>
    </Modal>
  );
}
