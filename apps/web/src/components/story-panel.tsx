"use client";
import { useEffect, useState } from "react";
import {
  Headphones,
  BookOpen,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import { Notice, Tag } from "./ui";
export function StoryPanel({
  site,
  index,
  onIndex,
  onClose,
  onComplete,
  startListening = false,
}: {
  site: HeritageSite;
  index: number;
  onIndex: (n: number) => void;
  onClose: () => void;
  onComplete: () => void;
  startListening?: boolean;
}) {
  const [listen, setListen] = useState(startListening),
    [playing, setPlaying] = useState(false),
    [simple, setSimple] = useState(false),
    [rate, setRate] = useState(1),
    [error, setError] = useState("");
  const block = site.stories[index] ?? site.stories[0];
  useEffect(() => {
    if (!playing) return;
    if (!("speechSynthesis" in window)) {
      setError(
        "Bu tarayıcı sesli okumayı desteklemiyor. Metinden devam edebilirsin.",
      );
      setPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      simple ? block.simple : block.text,
    );
    utterance.lang = "tr-TR";
    utterance.rate = rate;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setError("Ses başlatılamadı. Okuma modundan devam edebilirsin.");
        setPlaying(false);
      }
    };
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [playing, block, simple, rate]);
  return (
    <div className="story-panel">
      <div className="story-top">
        <div className="segmented">
          <button
            className={listen ? "active" : ""}
            onClick={() => setListen(true)}
          >
            <Headphones size={16} />
            Dinle
          </button>
          <button
            className={!listen ? "active" : ""}
            onClick={() => {
              setListen(false);
              setPlaying(false);
            }}
          >
            <BookOpen size={16} />
            Oku
          </button>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Hikâyeyi kapat"
        >
          <X size={18} />
        </button>
      </div>
      <div className="story-content">
        <small className="eyebrow">{site.name}</small>
        <div className="row between">
          <Tag>
            {index + 1} / {site.stories.length} bölüm
          </Tag>
          <label className="switch-label">
            <input
              type="checkbox"
              checked={simple}
              onChange={(e) => setSimple(e.target.checked)}
            />
            Sade anlatım
          </label>
        </div>
        <div className="story-steps">
          {site.stories.map((s, i) => (
            <button
              key={s.id}
              aria-label={`${i + 1}. bölüm: ${s.title}`}
              className={i <= index ? "done" : ""}
              onClick={() => {
                setPlaying(false);
                onIndex(i);
              }}
            />
          ))}
        </div>
        <h2>{block.title}</h2>
        <p className="story-text">{simple ? block.simple : block.text}</p>
        <Tag tone="representative">Örnek anlatım · doğrulama bekliyor</Tag>
        {listen && (
          <Notice>
            Ses, cihazının Türkçe metin okuma özelliğiyle üretilir. Profesyonel
            rehber kaydı henüz eklenmedi.
          </Notice>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="story-outline">
          {site.stories.map((s, i) => (
            <button
              key={s.id}
              className={i === index ? "current" : ""}
              onClick={() => {
                setPlaying(false);
                onIndex(i);
              }}
            >
              <span>
                {i < index ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {s.title}
            </button>
          ))}
        </div>
      </div>
      <div className="story-footer">
        {listen && (
          <div className="audio-controls">
            <button
              className="icon-btn"
              aria-label={playing ? "Sesi durdur" : "Sesli okumayı başlat"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause /> : <Play />}
            </button>
            <span>Türkçe · Cihaz sesi</span>
            <select
              aria-label="Ses hızı"
              value={rate}
              onChange={(e) => {
                setPlaying(false);
                setRate(Number(e.target.value));
              }}
            >
              <option value={0.75}>0.75×</option>
              <option value={1}>1×</option>
              <option value={1.25}>1.25×</option>
            </select>
          </div>
        )}
        <div className="row">
          <button
            className="btn secondary"
            disabled={index === 0}
            onClick={() => {
              setPlaying(false);
              onIndex(index - 1);
            }}
          >
            <ChevronLeft size={17} />
            Önceki
          </button>
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              if (index < site.stories.length - 1) onIndex(index + 1);
              else onComplete();
            }}
          >
            {index === site.stories.length - 1
              ? "Hikâyeyi tamamla"
              : "Devam et"}
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
