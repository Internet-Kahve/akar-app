"use client";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { Modal, Notice } from "./ui";
import { useI18n } from "./i18n";

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
  const { t } = useI18n();
  const wait = t("signin.wait");
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
          : t("signin.sendFailed"),
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
          : t("signin.codeInvalid"),
      );
    else onSignedIn();
  }
  return (
    <Modal title={t("common.signIn")} onClose={onClose}>
      {!supabase ? (
        <Notice>
          {t("signin.notConfigured")}
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
                {t("signin.sentTo", { email: email.trim() })}
              </p>
              <label className="field">
                {t("signin.code")}
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
                {t("signin.intro")}
              </p>
              <label className="field">
                {t("signin.email")}
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
                {t("signin.resend")}
              </button>
            ) : (
              <button type="button" className="btn secondary" onClick={onClose}>
                {t("common.cancel")}
              </button>
            )}
            <button className="btn" disabled={busy}>
              {sent ? (busy ? t("signin.verifying") : t("common.signIn")) : t("signin.sendCode")}
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
              {t("signin.changeEmail")}
            </button>
          )}
        </form>
      )}
    </Modal>
  );
}
