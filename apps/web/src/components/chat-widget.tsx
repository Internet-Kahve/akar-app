"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ApiError, type ChatAnswer, type ChatQuestion, type ChatTurn } from "@akar/api-client";
import { CHAT_MESSAGE_MAX, chatHistory } from "../lib/chat";
import { describeError, needsSignIn } from "../lib/errors";
import { useI18n } from "./i18n";
import { Modal } from "./ui";

interface Message extends ChatTurn {
  sources?: ChatAnswer["sources"];
  general?: boolean;
}

/**
 * Site assistant (§11.74, §11.77): a floating button on the public pages opens the conversation (full screen on a
 * phone). Signed-in users only: a guest's tap opens the sign-in. The conversation lives in this component only;
 * nothing is stored, and the current site (if any) goes with each question.
 */
export function ChatWidget({
  signedIn,
  site,
  ask,
  onSignIn,
}: {
  signedIn: boolean;
  site: { id: string; name: string } | undefined;
  ask: (question: ChatQuestion) => Promise<ChatAnswer>;
  onSignIn: (reason: string) => void;
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false),
    [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [pending, setPending] = useState(false),
    [problem, setProblem] = useState("");
  const log = useRef<HTMLOListElement>(null);

  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [messages, pending]);

  function explain(e: unknown) {
    if (e instanceof ApiError && e.status === 429) return t("chat.busy");
    if (e instanceof ApiError && e.status === 503) return t("chat.unavailable");
    if (e instanceof ApiError && e.status === 0) return describeError(e, t("chat.failed"), lang);
    // The API's own texts are Turkish; the English site gets ours.
    return lang === "tr" ? describeError(e, t("chat.failed"), lang) : t("chat.failed");
  }

  async function send() {
    const message = draft.trim();
    if (!message || pending) return;
    const history = chatHistory(messages);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setDraft("");
    setProblem("");
    setPending(true);
    try {
      const reply = await ask({ message, history, lang, ...(site && { siteId: site.id }) });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: reply.answer, sources: reply.sources, general: reply.general },
      ]);
    } catch (e) {
      // The question goes back into the box, so a retry is one tap.
      setMessages((m) => m.slice(0, -1));
      setDraft(message);
      if (needsSignIn(e)) {
        setOpen(false);
        onSignIn(t("chat.signIn"));
      } else setProblem(explain(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        aria-label={t("chat.open")}
        title={t("chat.open")}
        onClick={() => (signedIn ? setOpen(true) : onSignIn(t("chat.signIn")))}
      >
        <MessageCircle size={22} />
      </button>
      {open && (
        <Modal title={t("chat.title")} className="chat-sheet" onClose={() => setOpen(false)}>
          <p className="chat-note">{t("chat.note")}</p>
          {site && <p className="chat-context">{t("chat.siteContext", { name: site.name })}</p>}
          <ol className="chat-log" ref={log} aria-live="polite">
            {messages.length === 0 && !pending && <li className="chat-empty">{t("chat.empty")}</li>}
            {messages.map((m, i) => (
              <li key={i} className={`chat-msg ${m.role}`}>
                <span className="sr-only">{m.role === "user" ? t("chat.you") : t("chat.assistant")}: </span>
                <p>{m.text}</p>
                {m.general && (
                  <span className="chat-general" title={t("chat.generalNote")}>
                    {t("chat.general")}
                  </span>
                )}
                {!!m.sources?.length && (
                  <ul className="chat-sources" aria-label={t("chat.sources")}>
                    {m.sources.map((s, j) => (
                      <li key={j}>
                        {s.title}
                        {s.source && (
                          <small>
                            {s.source.title}
                            {s.source.page && `, ${s.source.page}`}
                          </small>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {pending && <li className="chat-msg assistant pending">{t("chat.thinking")}</li>}
          </ol>
          {problem && (
            <p className="chat-problem" role="alert">
              {problem}
            </p>
          )}
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              value={draft}
              maxLength={CHAT_MESSAGE_MAX}
              rows={2}
              placeholder={t("chat.placeholder")}
              aria-label={t("chat.placeholder")}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="submit" className="btn" disabled={pending || !draft.trim()} aria-label={t("chat.send")}>
              <Send size={18} />
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
