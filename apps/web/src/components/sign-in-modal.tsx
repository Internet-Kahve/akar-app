"use client";
import { useState } from "react";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";
import { Modal, Notice } from "./ui";
import { useI18n } from "./i18n";
import { track } from "../lib/usage";

/** Set just before the page leaves for Google; the page that comes back reads it once to count the sign-in. */
const GOOGLE_KEY = "akar.google-giris";
/** The Google round trip (consent screen included) is not older than this when it counts. */
const GOOGLE_MAX_MS = 10 * 60_000;

/** Counts a sign-in that came back from Google, once; `false` when this session did not just leave for Google. */
export function takeGoogleSignIn(): boolean {
  try {
    const started = Number(sessionStorage.getItem(GOOGLE_KEY));
    sessionStorage.removeItem(GOOGLE_KEY);
    return started > 0 && Date.now() - started < GOOGLE_MAX_MS;
  } catch {
    return false;
  }
}

/** A sign-in made here (not through Google) is counted at once; a Google round trip left unfinished must not count it again. */
function countSignIn(kind: "new" | "returning") {
  try {
    sessionStorage.removeItem(GOOGLE_KEY);
  } catch {}
  track("account.sign_in", undefined, kind);
}

/**
 * password: e-mail + password sign-in (default).
 * signup: new account; the e-mail is confirmed once with a code.
 * code: e-mail code sign-in (forgot password, accounts without a password); a new password follows.
 */
type Mode = "password" | "signup" | "code";
/** form: e-mail (+ password); verify: code from the e-mail; newPassword: after a code sign-in. */
type Stage = "form" | "verify" | "newPassword";

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
  const [mode, setMode] = useState<Mode>("password"),
    [stage, setStage] = useState<Stage>("form"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const supabase = getSupabase();
  const address = email.trim();

  /** Runs one auth call with the busy flag; returns its error, already shown when `fallback` is given. */
  async function run(call: () => Promise<{ error: AuthError | null }>, fallback: string) {
    setBusy(true);
    setError("");
    const { error: failure } = await call();
    setBusy(false);
    if (failure) setError(messageFor(failure, fallback));
    return failure;
  }
  function messageFor(failure: AuthError, fallback: string) {
    if (failure.status === 429) return t("signin.wait");
    if (failure.code === "weak_password") return t("signin.weakPassword");
    if (failure.code === "invalid_credentials") return t("signin.wrongPassword");
    return fallback;
  }
  function switchMode(next: Mode) {
    setMode(next);
    setStage("form");
    setCode("");
    setPassword("");
    setError("");
  }

  async function google() {
    if (!supabase) return;
    // The page leaves for Google and comes back signed in: the return counts the sign-in (`takeGoogleSignIn`).
    try {
      sessionStorage.setItem(GOOGLE_KEY, String(Date.now()));
    } catch {}
    await run(
      () =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          // Supabase consumes the token hash. Keep the return marker in the query so
          // the introduction redirect cannot send a successful sign-in to the landing page.
          options: { redirectTo: `${window.location.origin}/?auth=callback` },
        }),
      t("signin.googleFailed"),
    );
  }
  async function signInWithPassword() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: failure } = await supabase.auth.signInWithPassword({ email: address, password });
    if (failure?.code === "email_not_confirmed") {
      // Sign-up was never confirmed: send a fresh code and continue there.
      const { error: resendFailure } = await supabase.auth.resend({ type: "signup", email: address });
      setBusy(false);
      if (resendFailure) setError(messageFor(resendFailure, t("signin.sendFailed")));
      else {
        setMode("signup");
        setStage("verify");
        setError(t("signin.notConfirmed"));
      }
      return;
    }
    setBusy(false);
    if (failure) setError(messageFor(failure, t("signin.wrongPassword")));
    else {
      countSignIn("returning");
      onSignedIn();
    }
  }
  async function signUp() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { data, error: failure } = await supabase.auth.signUp({ email: address, password });
    setBusy(false);
    if (failure) setError(messageFor(failure, t("signin.signupFailed")));
    else if (data.session) {
      countSignIn("new");
      onSignedIn();
    } else setStage("verify");
  }
  async function sendCode() {
    if (!supabase) return;
    const failure =
      mode === "signup"
        ? await run(() => supabase.auth.resend({ type: "signup", email: address }), t("signin.sendFailed"))
        : await run(
            () => supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true } }),
            t("signin.sendFailed"),
          );
    if (!failure) setStage("verify");
  }
  async function verify() {
    if (!supabase) return;
    const failure = await run(
      () =>
        supabase.auth.verifyOtp({ email: address, token: code.replace(/\s/g, ""), type: "email" }),
      t("signin.codeInvalid"),
    );
    if (failure) return;
    if (mode === "code") {
      // The code has signed the visitor in; the new password that follows is not a second sign-in.
      countSignIn("returning");
      setPassword("");
      setStage("newPassword");
    } else {
      countSignIn(mode === "signup" ? "new" : "returning");
      onSignedIn();
    }
  }
  async function savePassword() {
    if (!supabase) return;
    const failure = await run(() => supabase.auth.updateUser({ password }), t("signin.passwordFailed"));
    if (!failure) onSignedIn();
  }

  function submit() {
    if (stage === "verify") return verify();
    if (stage === "newPassword") return savePassword();
    if (mode === "password") return signInWithPassword();
    if (mode === "signup") return signUp();
    return sendCode();
  }

  const passwordField = (label: string, autoComplete: string) => (
    <label className="field">
      {label}
      <input
        type="password"
        autoComplete={autoComplete}
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </label>
  );

  return (
    <Modal title={mode === "signup" ? t("signin.createAccount") : t("common.signIn")} onClose={onClose}>
      {!supabase ? (
        <Notice>{t("signin.notConfigured")}</Notice>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {reason && <Notice>{reason}</Notice>}
          {stage === "verify" ? (
            <>
              <p className="muted">{t("signin.sentTo", { email: address })}</p>
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
          ) : stage === "newPassword" ? (
            <>
              <p className="muted">{t("signin.newPasswordIntro")}</p>
              {passwordField(t("signin.newPassword"), "new-password")}
              <p className="muted">{t("signin.passwordHint")}</p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn secondary signin-google"
                disabled={busy}
                onClick={() => void google()}
              >
                {t("signin.google")}
              </button>
              <p className="muted">{t("signin.or")}</p>
              {mode !== "password" && (
                <p className="muted">{mode === "signup" ? t("signin.signupIntro") : t("signin.intro")}</p>
              )}
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
              {mode === "password" && passwordField(t("signin.password"), "current-password")}
              {mode === "signup" && (
                <>
                  {passwordField(t("signin.password"), "new-password")}
                  <p className="muted">{t("signin.passwordHint")}</p>
                </>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            {stage === "verify" ? (
              <button type="button" className="btn secondary" disabled={busy} onClick={() => void sendCode()}>
                {t("signin.resend")}
              </button>
            ) : stage === "newPassword" ? (
              <button type="button" className="btn secondary" disabled={busy} onClick={onSignedIn}>
                {t("signin.later")}
              </button>
            ) : (
              <button type="button" className="btn secondary" onClick={onClose}>
                {t("common.cancel")}
              </button>
            )}
            <button className="btn" disabled={busy}>
              {stage === "verify" ? (
                <>
                  {busy ? t("signin.verifying") : t("common.signIn")}
                  <ArrowRight size={16} />
                </>
              ) : stage === "newPassword" ? (
                <>
                  {t("signin.savePassword")}
                  <KeyRound size={16} />
                </>
              ) : mode === "code" ? (
                <>
                  {t("signin.sendCode")}
                  <Mail size={16} />
                </>
              ) : (
                <>
                  {mode === "signup" ? t("signin.createAccount") : t("common.signIn")}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
          {stage === "verify" && (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setStage("form");
                setCode("");
                setError("");
              }}
            >
              {t("signin.changeEmail")}
            </button>
          )}
          {stage === "form" && (
            <div className="signin-links">
              {mode !== "signup" && (
                <button type="button" className="text-btn" onClick={() => switchMode("signup")}>
                  {t("signin.toSignup")}
                </button>
              )}
              {mode !== "password" && (
                <button type="button" className="text-btn" onClick={() => switchMode("password")}>
                  {t("signin.toPassword")}
                </button>
              )}
              {mode !== "code" && (
                <button type="button" className="text-btn" onClick={() => switchMode("code")}>
                  {t("signin.toCode")}
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
