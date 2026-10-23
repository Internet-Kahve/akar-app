"use client";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { Modal, Notice } from "./ui";

const wait = "Çok fazla deneme yaptın. Biraz bekleyip yeniden dene.";

export function SignInModal({
  reason,
  onClose,
  onSignedIn,
}: {
  /** Why the dialog opened, e.g. the action that needs an account. */
  reason?: string;
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const supabase = getSupabase();
  async function sendCode() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: failure } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (failure)
      setError(
        failure.status === 429
          ? wait
          : "Kod gönderilemedi. E-posta adresini kontrol edip yeniden dene.",
      );
    else setSent(true);
  }
  async function verify() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: failure } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.replace(/\s/g, ""),
      type: "email",
    });
    setBusy(false);
    if (failure)
      setError(
        failure.status === 429
          ? wait
          : "Kod geçersiz ya da süresi dolmuş. Kodu kontrol et veya yeni kod iste.",
      );
    else onSignedIn();
  }
  return (
    <Modal title="Giriş yap" onClose={onClose}>
      {!supabase ? (
        <Notice>
          Giriş bu kurulumda yapılandırılmamış (NEXT_PUBLIC_SUPABASE_URL ve
          NEXT_PUBLIC_SUPABASE_ANON_KEY eksik).
        </Notice>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (sent ? verify() : sendCode());
          }}
        >
          {reason && <Notice>{reason}</Notice>}
          {sent ? (
            <>
              <p className="muted">
                {email.trim()} adresine bir doğrulama kodu gönderdik.
              </p>
              <label className="field">
                Doğrulama kodu
                <input
                  className="otp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,12}"
                  maxLength={12}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <p className="muted">
                E-posta adresine bir doğrulama kodu göndereceğiz. Hesabın yoksa
                otomatik oluşturulur.
              </p>
              <label className="field">
                E-posta
                <input
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            {sent ? (
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => void sendCode()}
              >
                Kodu yeniden gönder
              </button>
            ) : (
              <button type="button" className="btn secondary" onClick={onClose}>
                Vazgeç
              </button>
            )}
            <button className="btn" disabled={busy}>
              {sent ? (busy ? "Doğrulanıyor…" : "Giriş yap") : "Kod gönder"}
              {sent ? <ArrowRight size={16} /> : <Mail size={16} />}
            </button>
          </div>
          {sent && (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setSent(false);
                setCode("");
                setError("");
              }}
            >
              E-posta adresini değiştir
            </button>
          )}
        </form>
      )}
    </Modal>
  );
}
