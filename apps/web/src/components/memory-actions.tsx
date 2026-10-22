"use client";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  MEMORY_POINTS,
  memoryPermissions,
  type Command,
  type Memory,
  type Role,
} from "@akar/domain";
import { Modal } from "./ui";
type Commit = (command: Command) => Promise<boolean>;

/** Longest reason the API accepts (`DecisionBody` in `services/api/src/modules/moderation/schemas.ts`). */
const REASON_MAX = 500;
const REASON_SEPARATOR = " — ";
const reasons = [
  "Yüz ya da kişisel bilgi içeriyor",
  "Bu esere ait değil",
  "Uygunsuz içerik",
  "Başkasına ait fotoğraf (telif)",
  "Bilgi yanlış ya da kaynaksız",
];
/** Needs an explanation; the API gets "Diğer — <açıklama>". */
const OTHER = "Diğer";

const relative = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });
const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];
function timeAgo(iso: string) {
  const seconds = (Date.now() - Date.parse(iso)) / 1000;
  const unit = units.find(([, size]) => seconds >= size);
  return unit
    ? relative.format(-Math.floor(seconds / unit[1]), unit[0])
    : "az önce";
}

function ConfirmDialog({
  title,
  confirm,
  onClose,
  onConfirm,
  children,
}: {
  title: string;
  confirm: string;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  // Rendered in document.body, so the container's styles do not reach the dialog.
  return createPortal(
    <Modal title={title} onClose={onClose}>
      {children}
      <div className="modal-actions">
        <button type="button" className="btn secondary" onClick={onClose}>
          Vazgeç
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            // Closed on failure too: the error toast sits under an open dialog's backdrop.
            onClose();
          }}
        >
          {confirm}
        </button>
      </div>
    </Modal>,
    document.body,
  );
}

/** "Yayından kaldır": a reason is mandatory and the author sees it under "Paylaşımlarım". */
function ReasonDialog({
  memory,
  siteName,
  onClose,
  onConfirm,
}: {
  memory: Memory;
  siteName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
}) {
  const [choice, setChoice] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [age] = useState(() => timeAgo(memory.createdAt));
  const other = choice === OTHER;
  const text = note.trim();
  const reason = text ? `${choice}${REASON_SEPARATOR}${text}` : choice;
  const valid = !!choice && (!other || !!text);
  return createPortal(
    <Modal title="Yayından kaldır" onClose={onClose}>
      <p className="muted">
        {siteName} · {memory.photo ? "Fotoğraf + anı" : "Sadece anı"} · {age}
      </p>
      <fieldset className="reason-list">
        <legend>Ret nedeni · zorunlu</legend>
        {[...reasons, OTHER].map((r) => (
          <label className="checkbox-label" key={r}>
            <input
              type="radio"
              name="removal-reason"
              checked={choice === r}
              onChange={() => setChoice(r)}
            />
            {r === OTHER ? "Diğer (açıkla)" : r}
          </label>
        ))}
      </fieldset>
      <label className="field">
        {other ? "Kullanıcıya not · zorunlu" : "Kullanıcıya not · isteğe bağlı"}
        <textarea
          value={note}
          required={other}
          maxLength={Math.max(
            0,
            REASON_MAX - choice.length - REASON_SEPARATOR.length,
          )}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <p className="muted">
        Ret nedeni kullanıcıya bildirim olarak gider ve Profil ›
        Paylaşımlarım'da görünür.
      </p>
      <div className="modal-actions">
        <button type="button" className="btn secondary" onClick={onClose}>
          Vazgeç
        </button>
        <button
          type="button"
          className="btn"
          disabled={!valid || busy}
          onClick={async () => {
            setBusy(true);
            if (await onConfirm(reason)) onClose();
            else setBusy(false);
          }}
        >
          Yayından kaldır
        </button>
      </div>
    </Modal>,
    document.body,
  );
}

/**
 * The removal buttons one memory offers this user, with their dialogs. Renders only buttons (the caller
 * provides the row); which ones is decided by `memoryPermissions`, the server enforces the same rules.
 */
export function MemoryActions({
  memory,
  siteName,
  role,
  own,
  commit,
  variant = "link",
}: {
  memory: Memory;
  siteName: string;
  role: Role;
  /** The memory is the current user's (an id of `Snapshot.memories`). */
  own: boolean;
  commit: Commit;
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState<"remove" | "takedown" | "purge">();
  const can = memoryPermissions(role, memory.status, own);
  if (!can.remove && !can.takedown && !can.purge) return null;
  const look = variant === "button" ? "btn secondary" : "text-btn";
  const close = () => setOpen(undefined);
  const subject = memory.photo ? "Bu anı ve fotoğrafı" : "Bu anı";
  const published = memory.status === "approved";
  return (
    <>
      {can.takedown && (
        <button
          type="button"
          className={look}
          onClick={() => setOpen("takedown")}
        >
          Yayından kaldır
        </button>
      )}
      {can.purge && (
        <button
          type="button"
          className={`${look} danger`}
          onClick={() => setOpen("purge")}
        >
          Kalıcı sil
        </button>
      )}
      {can.remove && (
        <button
          type="button"
          className={`${look} danger`}
          onClick={() => setOpen("remove")}
        >
          Sil
        </button>
      )}
      {open === "takedown" && (
        <ReasonDialog
          memory={memory}
          siteName={siteName}
          onClose={close}
          onConfirm={(reason) =>
            commit({
              type: "moderate",
              id: memory.id,
              status: "rejected",
              reason,
            })
          }
        />
      )}
      {open === "remove" && (
        <ConfirmDialog
          title="Anı silinsin mi?"
          confirm="Evet, sil"
          onClose={close}
          onConfirm={() => commit({ type: "delete-memory", id: memory.id })}
        >
          <p>{subject} kalıcı olarak silinecek. Emin misin?</p>
          {published && (
            <p className="muted">
              Yayındaki anı için kazandığın {MEMORY_POINTS} puan geri alınır.
            </p>
          )}
        </ConfirmDialog>
      )}
      {open === "purge" && (
        <ConfirmDialog
          title="Anı kalıcı silinsin mi?"
          confirm="Evet, kalıcı sil"
          onClose={close}
          onConfirm={() =>
            commit({ type: "admin-delete-memory", id: memory.id })
          }
        >
          <p>{subject} herkes için kalıcı olarak silinecek. Emin misin?</p>
          {published && (
            <p className="muted">Yazarın {MEMORY_POINTS} puanı geri alınır.</p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
