"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, RotateCcw, Share2, X } from "lucide-react";
import type { HistoryImage, HeritageSite } from "@akar/domain";

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
  const [consent, setConsent] = useState(!image.viewpoint?.interior),
    [denied, setDenied] = useState(false),
    [shot, setShot] = useState(""),
    [fade, setFade] = useState(50),
    [compare, setCompare] = useState<"slider" | "side">("slider"),
    [split, setSplit] = useState(50),
    [place, setPlace] = useState({ x: 0, y: 0, scale: 1 }),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    pickFile = useRef<HTMLInputElement>(null),
    fingers = useRef(new Map<number, { x: number; y: number }>());
  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  const startCamera = async () => {
    setDenied(false);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (video.current) video.current.srcObject = stream.current;
    } catch {
      setDenied(true);
    }
  };
  useEffect(() => {
    if (consent && !shot) void startCamera();
    return stopCamera;
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
    const blob = await (await fetch(shot)).blob();
    const file = new File([blob], `${site.id}.jpg`, { type: "image/jpeg" });
    const text = `${site.name} · ${image.dateLabel}\n${image.photo.description}`;
    if (navigator.canShare?.({ files: [file] }))
      await navigator.share({ files: [file], text }).catch(() => {});
    else {
      const link = document.createElement("a");
      link.href = shot;
      link.download = file.name;
      link.click();
    }
  };
  const title = `${site.name} · ${image.dateLabel}`;
  if (!consent)
    return (
      <div className="camera" role="dialog" aria-modal="true" aria-label={title}>
        <div className="camera-note">
          <h2>İç mekânda fotoğraf</h2>
          <p>
            Namaz vaktinde çekim yapma, kişilerin yüzünü çekme ve flaş kullanma.
          </p>
          <button className="btn" onClick={() => setConsent(true)}>
            Anladım
          </button>
          <button className="btn secondary" onClick={onClose}>
            Vazgeç
          </button>
        </div>
      </div>
    );
  return (
    <div className="camera" role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <button className="round-btn" aria-label="Kamerayı kapat" onClick={onClose}>
          <X size={18} />
        </button>
        <span>{title}</span>
      </header>
      {shot ? (
        <>
          <div className="camera-tabs" role="group" aria-label="Karşılaştırma">
            <button aria-pressed={compare === "slider"} onClick={() => setCompare("slider")}>
              Kaydırıcı
            </button>
            <button aria-pressed={compare === "side"} onClick={() => setCompare("side")}>
              Yan yana
            </button>
          </div>
          <div className={`camera-result ${compare}`}>
            <img src={shot} alt="Senin fotoğrafın" />
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
              aria-label="Eski ve yeni fotoğrafı karşılaştır"
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
              İz Bırak olarak gönder
            </button>
            <div>
              <button className="btn secondary" onClick={() => void share()}>
                <Share2 size={17} />
                Paylaş
              </button>
              <button className="btn secondary" onClick={() => setShot("")}>
                <RotateCcw size={17} />
                Tekrar çek
              </button>
            </div>
            <small>Paylaşılan görselde kaynak satırı otomatik yazılır.</small>
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
                <h2>Kameraya izin verilmedi</h2>
                <button className="btn" onClick={() => void startCamera()}>
                  Tekrar dene
                </button>
                <button
                  className="btn secondary"
                  onClick={() => pickFile.current?.click()}
                >
                  Galeriden seç
                </button>
              </div>
            )}
          </div>
          <p className="camera-hint">Eski fotoğrafı görüntüyle çakıştır</p>
          <label className="camera-fade">
            Eski
            <input
              type="range"
              aria-label="Eski fotoğrafın saydamlığı"
              value={100 - fade}
              onChange={(e) => setFade(100 - Number(e.target.value))}
            />
            Bugün
          </label>
          <div className="camera-bar">
            <img src={image.photo.src} alt="" />
            <button className="camera-shutter" aria-label="Fotoğraf çek" onClick={capture}>
              <Camera size={26} />
            </button>
            <button
              className="round-btn"
              aria-label="Galeriden seç"
              onClick={() => pickFile.current?.click()}
            >
              <ImageIcon size={20} />
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
