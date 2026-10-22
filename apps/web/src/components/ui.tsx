"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, ArrowLeft, Check, Info } from "lucide-react";
import { useUploadProgress } from "../lib/upload-progress";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Pencereyi kapat"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Back({
  onClick,
  children = "Keşfe dön",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button className="back" onClick={onClick}>
      <ArrowLeft size={17} />
      {children}
    </button>
  );
}
export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`tag ${tone}`}>
      {tone === "success" ? <Check size={12} /> : null}
      {children}
    </span>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <Info size={17} />
      <span>{children}</span>
    </div>
  );
}
export function UploadProgress() {
  const fraction = useUploadProgress();
  if (fraction === null) return null;
  const percent = Math.round(fraction * 100);
  return (
    <div
      className="upload-progress"
      role="progressbar"
      aria-label="Fotoğraf yükleniyor"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span style={{ width: `${percent}%` }} />
      <small>Fotoğraf yükleniyor · %{percent}</small>
    </div>
  );
}
export function Motif() {
  return (
    <div className="motif">
      <span />
      <img src="/figma/dd9ae.svg" alt="" />
      <span />
    </div>
  );
}
