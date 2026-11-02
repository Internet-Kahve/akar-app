"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { sized } from "../lib/image-size";
import { CameraOff, Image as ImageIcon, Info, RotateCw, Share2, X } from "lucide-react";
import type { HistoryImage, HeritageSite } from "@akar/domain";
import { useI18n } from "./i18n";

/** A photograph made smaller for sending (long side 1280 px, JPEG): re-encoding also drops EXIF and location. */
export async function shrinkPhoto(src: string, longSide = 1280) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = Math.min(1, longSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Kamera and Çekildi (prototype `kameraSayfa`, `cekildiSayfa`): the old photograph lies over the live view, half
 * see-through; two fingers or the wheel scale it, one finger moves it. The shot is compared with the old one (slider
 * or side by side) and can go on as an İz Bırak.
 */
export function HistoryCamera({
  site,
  image,
  wide,
  onClose,
  onSend,
}: {
  site: HeritageSite;
  image: HistoryImage;
  wide: boolean;
  onClose: () => void;
  /** The shot, made smaller, and the «same angle» label of the old photograph. */
  onSend: (photo: string, sameAngle: string) => void;
}) {
  const { t, text } = useI18n();
  const siteName = text(site.name, site.nameEn);
  const interior = !!image.viewpoint?.interior;
  const [rules, setRules] = useState(interior),
    [denied, setDenied] = useState<null | "denied" | "insecure">(null),
    [shot, setShot] = useState(""),
    [fade, setFade] = useState(50),
    [mode, setMode] = useState<"kaydirici" | "yanyana">("kaydirici"),
    [split, setSplit] = useState(50),
    [place, setPlace] = useState({ x: 0, y: 0, s: 1 }),
    [note, setNote] = useState("");
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    fingers = useRef(new Map<number, [number, number]>()),
    start = useRef<{ place: typeof place; fingers: Map<number, [number, number]> } | null>(null),
    sliding = useRef(false);
  const stop = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };
  const begin = async () => {
    stop();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setDenied("insecure");
        return;
      }
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } },
        audio: false,
      });
      if (video.current) video.current.srcObject = stream.current;
      setDenied(null);
    } catch {
      setDenied("denied");
    }
  };
  useEffect(() => {
    if (!shot) void begin();
    return stop;
    // The camera restarts only when the visitor goes back to it from the shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot]);
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(""), 4500);
    return () => clearTimeout(timer);
  }, [note]);
  const take = () => {
    const v = video.current;
    if (!v?.videoWidth) {
      setNote(t("gg.noCameraImage"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    stop();
    setShot(canvas.toDataURL("image/jpeg", 0.85));
  };
  const fromGallery = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      stop();
      setShot(String(reader.result));
    };
    reader.readAsDataURL(file);
  };
  const reset = () => (start.current = { place, fingers: new Map(fingers.current) });
  const move = (e: React.PointerEvent) => {
    if (!fingers.current.has(e.pointerId) || !start.current) return;
    fingers.current.set(e.pointerId, [e.clientX, e.clientY]);
    const ids = [...fingers.current.keys()],
      was = ids.map((id) => start.current!.fingers.get(id)).filter(Boolean) as [number, number][],
      now = ids.map((id) => fingers.current.get(id)!),
      from = start.current.place;
    if (now.length === 1 && was.length === 1)
      setPlace({ ...from, x: from.x + now[0]![0] - was[0]![0], y: from.y + now[0]![1] - was[0]![1] });
    else if (now.length >= 2 && was.length >= 2) {
      const gap = (p: [number, number][]) => Math.hypot(p[0]![0] - p[1]![0], p[0]![1] - p[1]![1]);
      setPlace({ ...from, s: Math.min(4, Math.max(0.3, (from.s * gap(now)) / gap(was))) });
    }
  };
  const lift = (e: React.PointerEvent) => {
    fingers.current.delete(e.pointerId);
    reset();
  };
  const sameAngle = image.dateLabel ? t("gg.sameAngle", { date: image.dateLabel }) : t("gg.sameAngleUndated");
  const share = () => {
    if (navigator.share)
      void navigator
        .share({ title: `${siteName} · ${image.dateLabel}`, text: image.photo.description })
        .catch(() => {});
    else setNote(t("gg.shareUnsupported"));
  };
  const close = (
    <button className="kam-x" aria-label={t("site.cameraClose")} onClick={onClose}>
      <X size={20} />
    </button>
  );
  const fileInput = (
    <input type="file" accept="image/*" hidden onChange={(e) => fromGallery(e.target.files?.[0])} />
  );
  if (shot)
    return (
      <div className={`kam cek ${wide ? "kam-d" : ""}`} role="dialog" aria-modal="true" aria-label={t("gg.shot")}>
        <div className="kam-ust">
          {close}
          <div>
            <b>{t("gg.shot")}</b>
            <small>{t("gg.shotSub", { name: siteName, date: image.dateLabel })}</small>
          </div>
        </div>
        <div className="cek-sekme" role="tablist">
          {(["kaydirici", "yanyana"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}>
              {t(k === "kaydirici" ? "site.cameraSlider" : "site.cameraSideBySide")}
            </button>
          ))}
        </div>
        <div
          className={`cek-karsi ${mode === "yanyana" ? "yanyana" : ""}`}
          style={{ "--ayrim": `${split}%` } as CSSProperties}
          onPointerDown={(e) => {
            if (mode !== "kaydirici") return;
            sliding.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            setSplit(Math.min(98, Math.max(2, ((e.clientX - r.left) / r.width) * 100)));
          }}
          onPointerMove={(e) => {
            if (!sliding.current) return;
            const r = e.currentTarget.getBoundingClientRect();
            setSplit(Math.min(98, Math.max(2, ((e.clientX - r.left) / r.width) * 100)));
          }}
          onPointerUp={() => (sliding.current = false)}
        >
          <div className="cek-yeni">
            <img src={shot} alt={t("site.cameraYourPhoto")} />
            <span className="cek-etiket sag">{t("site.cameraYourPhoto")}</span>
          </div>
          <div className="cek-eski">
            <img src={image.photo.src} alt={image.photo.alt} />
            <span className="cek-etiket">{image.dateLabel}</span>
          </div>
          <button className="cek-tutamak" aria-label={t("gg.slide")}>
            ‹ ›
          </button>
        </div>
        <p className="cek-not">{t("gg.shotNote")}</p>
        <div className="cek-dugmeler">
          <button
            className="btn ana tam"
            onClick={() =>
              void shrinkPhoto(shot)
                .then((photo) => onSend(photo, sameAngle))
                .catch(() => onSend(shot, sameAngle))
            }
          >
            {t("site.cameraSendTrace")}
          </button>
          <div className="ikili">
            <button className="btn koyu" onClick={share}>
              <Share2 size={18} />
              {t("site.cameraShare")}
            </button>
            <button className="btn koyu" onClick={() => setShot("")}>
              <RotateCw size={18} />
              {t("site.cameraRetake")}
            </button>
          </div>
          <small>{t("site.cameraShareNote")}</small>
        </div>
        {note && <div className="kam-toast" role="status">{note}</div>}
      </div>
    );
  return (
    <div className={`kam ${wide ? "kam-d" : ""}`} role="dialog" aria-modal="true" aria-label={`${siteName} · ${image.dateLabel}`}>
      <div className="kam-ust">
        {close}
        <div>
          <b>
            {siteName} · {image.dateLabel}
          </b>
          <small>{interior ? t("gg.typeInterior") : text(image.caption, image.captionEn)}</small>
        </div>
      </div>
      <div
        className="kam-alan"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fingers.current.set(e.pointerId, [e.clientX, e.clientY]);
          reset();
        }}
        onPointerMove={move}
        onPointerUp={lift}
        onPointerCancel={lift}
        onWheel={(e) => setPlace((p) => ({ ...p, s: Math.min(4, Math.max(0.3, p.s * (e.deltaY < 0 ? 1.08 : 0.92))) }))}
      >
        <video ref={video} autoPlay playsInline muted />
        <img
          className="kam-eski"
          src={image.photo.src}
          alt=""
          style={{ opacity: 1 - fade / 100, transform: `translate(${place.x}px, ${place.y}px) scale(${place.s})` }}
        />
      </div>
      <div className="kam-ipucu">{t("site.cameraHint")}</div>
      <div className="kam-kaydirici">
        <span>{t("site.cameraOld")}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={fade}
          aria-label={t("site.cameraFadeRange")}
          onChange={(e) => setFade(Number(e.target.value))}
        />
        <span>{t("site.cameraToday")}</span>
      </div>
      <div className="kam-alt">
        <img className="kam-kucuk" src={sized(image.photo.src, 96)} alt="" decoding="async" />
        <button className="kam-deklansor" aria-label={t("site.cameraShutter")} onClick={take}>
          <i />
        </button>
        <label className="kam-galeri">
          <span>
            <ImageIcon size={22} />
          </span>
          {t("site.cameraGallery")}
          {fileInput}
        </label>
      </div>
      {denied && (
        <div className="kam-modal">
          <div className="kutu">
            <CameraOff size={40} />
            <b>{t("site.cameraDenied")}</b>
            <span>{t(denied === "insecure" ? "gg.cameraInsecure" : "gg.cameraDeniedBody")}</span>
            <button className="btn ana tam" onClick={() => void begin()}>
              {t("site.cameraRetry")}
            </button>
            <label className="btn cerceve tam">
              {t("site.cameraPickFile")}
              {fileInput}
            </label>
          </div>
          <button className="metin-btn kam-don" onClick={onClose}>
            {t("gg.backToHistory")}
          </button>
        </div>
      )}
      {rules && (
        <div className="kam-sayfa">
          <div className="kutu">
            <b>
              <Info size={22} />
              {t("gg.cameraInterior")}
            </b>
            <ul>
              <li>{t("gg.cameraRule1")}</li>
              <li>{t("gg.cameraRule2")}</li>
              <li>{t("gg.cameraRule3")}</li>
            </ul>
            <button className="btn ana tam" onClick={() => setRules(false)}>
              {t("site.cameraUnderstood")}
            </button>
          </div>
        </div>
      )}
      {note && <div className="kam-toast" role="status">{note}</div>}
    </div>
  );
}
