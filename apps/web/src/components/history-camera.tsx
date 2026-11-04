"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, RotateCcw, Share2, X } from "lucide-react";
import type { HistoryImage, HeritageSite } from "@akar/domain";
import { useI18n } from "./i18n";
import { useNativeBack } from "../lib/use-native";
import { sharePhoto } from "../lib/share-photo";

/**
 * Matches the old photograph with the live camera: the old one lies over the view, half see-through, and two
 * fingers move and scale it. The picture stays on the device until the visitor sends it as a memory.
 */
export function HistoryCamera({
  site,
  image,
  onClose,
  onMemory,
}: {
  site: HeritageSite;
  image: HistoryImage;
  onClose: () => void;
  onMemory: () => void;
}) {
  const i18n = useI18n(),
    { t } = i18n,
    siteName = i18n.text(site.name, site.nameEn);
  useNativeBack(() => { onClose(); return true; }, 10);
  const [consent, setConsent] = useState(!image.viewpoint?.interior),
    [denied, setDenied] = useState(false),
    [shareFailed, setShareFailed] = useState(false),
    [sharing, setSharing] = useState(false),
    [shot, setShot] = useState(""),
    [fade, setFade] = useState(50),
    [compare, setCompare] = useState<"slider" | "side">("slider"),
    [split, setSplit] = useState(50),
    [place, setPlace] = useState({ x: 0, y: 0, scale: 1 }),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    cameraRequest = useRef(0),
    pickFile = useRef<HTMLInputElement>(null),
    fingers = useRef(new Map<number, { x: number; y: number }>());
  const stopCamera = () => {
    cameraRequest.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  const startCamera = async () => {
    stopCamera();
    const request = cameraRequest.current;
    setDenied(false);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (request !== cameraRequest.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      if (video.current) video.current.srcObject = media;
    } catch {
      if (request === cameraRequest.current) setDenied(true);
    }
  };
  useEffect(() => {
    if (consent && !shot) void startCamera();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stopCamera();
      else if (consent && !shot) void startCamera();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopCamera();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [consent, shot]);
  const capture = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
  };
  const onMove = (e: React.PointerEvent) => {
    const points = fingers.current,
      before = points.get(e.pointerId);
    if (!before) return;
    const others = [...points.entries()].filter(([id]) => id !== e.pointerId);
    const now = { x: e.clientX, y: e.clientY };
    if (others.length === 1) {
      const other = others[0]![1],
        was = Math.hypot(before.x - other.x, before.y - other.y),
        is = Math.hypot(now.x - other.x, now.y - other.y);
      if (was)
        setPlace((p) => ({
          ...p,
          scale: Math.min(4, Math.max(0.5, (p.scale * is) / was)),
        }));
    } else
      setPlace((p) => ({
        ...p,
        x: p.x + now.x - before.x,
        y: p.y + now.y - before.y,
      }));
    points.set(e.pointerId, now);
  };
  const share = async () => {
    const text = `${siteName} · ${image.dateLabel}\n${image.photo.description}`;
    setShareFailed(false);
    setSharing(true);
    try { await sharePhoto(shot, site.id, text); }
    catch (error) {
      const e = error as { name?: string; message?: string };
      if (e.name !== "AbortError" && !/cancel/i.test(e.message ?? "")) setShareFailed(true);
    } finally { setSharing(false); }
  };
  const title = `${siteName} · ${image.dateLabel}`;
  if (!consent)
    return (
      <div className="camera" role="dialog" aria-modal="true" aria-label={title}>
        <div className="camera-note">
          <h2>{t("site.cameraInteriorTitle")}</h2>
          <p>{t("site.cameraInteriorNote")}</p>
          <button className="btn" onClick={() => setConsent(true)}>
            {t("site.cameraUnderstood")}
          </button>
          <button className="btn secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  return (
    <div className="camera" role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <button className="round-btn" aria-label={t("site.cameraClose")} onClick={onClose}>
          <X size={18} />
        </button>
        <div className="camera-title"><b>{title}</b><small>{image.caption}</small></div>
      </header>
      {shot ? (
        <>
          <div className="camera-tabs" role="group" aria-label={t("site.cameraCompare")}>
            <button aria-pressed={compare === "slider"} onClick={() => setCompare("slider")}>
              {t("site.cameraSlider")}
            </button>
            <button aria-pressed={compare === "side"} onClick={() => setCompare("side")}>
              {t("site.cameraSideBySide")}
            </button>
          </div>
          <div className={`camera-result ${compare}`}>
            <img src={shot} alt={t("site.cameraYourPhoto")} />
            <img
              src={image.photo.src}
              alt={image.photo.alt}
              style={
                compare === "slider"
                  ? { clipPath: `inset(0 ${100 - split}% 0 0)` }
                  : undefined
              }
            />
          </div>
          {compare === "slider" && (
            <input
              type="range"
              aria-label={t("site.cameraCompareRange")}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
            />
          )}
          <div className="camera-actions">
            <button
              className="btn"
              onClick={() => {
                stopCamera();
                onMemory();
              }}
            >
              {t("site.cameraSendTrace")}
            </button>
            <div>
              <button className="btn secondary" disabled={sharing} onClick={() => void share()}>
                <Share2 size={17} />
                {t("site.cameraShare")}
              </button>
              <button className="btn secondary" onClick={() => setShot("")}>
                <RotateCcw size={17} />
                {t("site.cameraRetake")}
              </button>
            </div>
            <small>{t("site.cameraShareNote")}</small>
            {shareFailed && <p role="alert">{t("error.failed")}</p>}
          </div>
        </>
      ) : (
        <>
          <div
            className="camera-view"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }}
            onPointerMove={onMove}
            onPointerUp={(e) => fingers.current.delete(e.pointerId)}
            onPointerCancel={(e) => fingers.current.delete(e.pointerId)}
          >
            <video ref={video} autoPlay playsInline muted />
            <img
              src={image.photo.src}
              alt=""
              style={{
                opacity: fade / 100,
                transform: `translate(${place.x}px, ${place.y}px) scale(${place.scale})`,
              }}
            />
            {denied && (
              <div className="camera-note">
                <h2>{t("site.cameraDenied")}</h2>
                <button className="btn" onClick={() => void startCamera()}>
                  {t("site.cameraRetry")}
                </button>
                <button
                  className="btn secondary"
                  onClick={() => pickFile.current?.click()}
                >
                  {t("site.cameraPickFile")}
                </button>
              </div>
            )}
          </div>
          <p className="camera-hint">{t("site.cameraHint")}</p>
          <label className="camera-fade">
            {t("site.cameraOld")}
            <input
              type="range"
              aria-label={t("site.cameraFadeRange")}
              value={100 - fade}
              onChange={(e) => setFade(100 - Number(e.target.value))}
            />
            {t("site.cameraToday")}
          </label>
          <div className="camera-bar">
            <img src={image.photo.src} alt="" />
            <button className="camera-shutter" aria-label={t("site.cameraShutter")} onClick={capture}>
              <Camera size={26} />
            </button>
            <button
              className="round-btn"
              aria-label={t("site.cameraPickFile")}
              onClick={() => pickFile.current?.click()}
            >
              <ImageIcon size={20} /><small>{t("site.cameraGallery")}</small>
            </button>
          </div>
        </>
      )}
      <input
        ref={pickFile}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setShot(String(reader.result));
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}
