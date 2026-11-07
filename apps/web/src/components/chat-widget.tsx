"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, MessageCircle, Send } from "lucide-react";
import {
  ApiError,
  type ChatAnswer,
  type ChatQuestion,
  type ChatTurn,
} from "@akar/api-client";
import { CHAT_MESSAGE_MAX, chatHistory, chatSourceUrl } from "../lib/chat";
import { describeError, needsSignIn } from "../lib/errors";
import { useI18n } from "./i18n";
import { Modal } from "./ui";

interface Message extends ChatTurn {
  sources?: ChatAnswer["sources"];
  general?: boolean;
  searchSuggestions?: string;
  webUnavailable?: boolean;
}

/**
 * Site assistant (§11.74, §11.77): a floating button on the public pages opens a conversation anchored right on desktop and left on mobile.
 * Signed-in users only: a guest's tap opens the sign-in. The conversation lives in this component only;
 * nothing is stored, and the current site (if any) goes with each question.
 */
export function ChatWidget({
  signedIn,
  open,
  onOpen,
  onClose,
  site,
  ask,
  onSignIn,
  onSite,
  mobileBottom = 144,
}: {
  mobileBottom?: number;
  signedIn: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  site: { id: string; name: string } | undefined;
  ask: (question: ChatQuestion) => Promise<ChatAnswer>;
  onSignIn: (reason: string) => void;
  onSite: (id: string) => void;
}) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [pending, setPending] = useState(false),
    [problem, setProblem] = useState("");
  const log = useRef<HTMLOListElement>(null);
  const sending = useRef(false);
  const suggestions = site
    ? [
        t("chat.exampleSiteHistory"),
        t("chat.exampleSiteArchitecture"),
        t("chat.exampleSiteWaqf"),
      ]
    : [t("chat.exampleExplore"), t("chat.exampleWaqf"), t("chat.exampleRoute")];

  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [messages, pending, open]);

  function explain(e: unknown) {
    if (e instanceof ApiError && e.status === 429) return t("chat.busy");
    if (e instanceof ApiError && e.status === 503) return t("chat.unavailable");
    if (e instanceof ApiError && e.status === 0)
      return describeError(e, t("chat.failed"), lang);
    // The API's own texts are Turkish; the English site gets ours.
    return lang === "tr"
      ? describeError(e, t("chat.failed"), lang)
      : t("chat.failed");
  }

  async function send(question = draft) {
    const message = question.trim().slice(0, CHAT_MESSAGE_MAX);
    if (!message || sending.current) return;
    sending.current = true;
    const history = chatHistory(messages);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setDraft("");
    setProblem("");
    setPending(true);
    try {
      const reply = await ask({
        message,
        history,
        lang,
        ...(site && { siteId: site.id }),
      });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: reply.answer,
          sources: reply.sources,
          general: reply.general,
          searchSuggestions: reply.searchSuggestions,
          webUnavailable: reply.webUnavailable,
        },
      ]);
    } catch (e) {
      // The question goes back into the box, so a retry is one tap.
      setMessages((m) => m.slice(0, -1));
      setDraft(message);
      if (needsSignIn(e)) {
        onClose();
        onSignIn(t("chat.signIn"));
      } else setProblem(explain(e));
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        style={{ "--chat-mobile-bottom": `${mobileBottom}px` } as CSSProperties}
        aria-label={t("chat.open")}
        title={t("chat.open")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (signedIn ? onOpen() : onSignIn(t("chat.signIn")))}
      >
        <MessageCircle size={22} />
      </button>
      {open && (
        <Modal title={t("chat.title")} className="chat-sheet" onClose={onClose}>
          {site && (
            <p className="chat-context">
              {t("chat.siteContext", { name: site.name })}
            </p>
          )}
          <ol
            className="chat-log"
            ref={log}
            aria-live="polite"
            aria-label={t("chat.conversation")}
          >
            {messages.length === 0 && !pending && (
              <li className="chat-empty">
                <MessageCircle size={28} aria-hidden="true" />
                <h3>{t("chat.welcome")}</h3>
                <p>{t(site ? "chat.emptySite" : "chat.empty")}</p>
                <div
                  className="chat-suggestions"
                  role="group"
                  aria-label={t("chat.examples")}
                >
                  {suggestions.map((question) => (
                    <button
                      type="button"
                      key={question}
                      onClick={() => void send(question)}
                    >
                      <span>{question}</span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </li>
            )}
            {messages.map((m, i) => (
              <li key={i} className={`chat-msg ${m.role}`}>
                <span className="sr-only">
                  {m.role === "user" ? t("chat.you") : t("chat.assistant")}
                  :{" "}
                </span>
                <p>{m.text}</p>
                {m.general && (
                  <span className="chat-general" title={t("chat.generalNote")}>
                    {t(
                      m.sources?.some((s) => s.kind === "web")
                        ? "chat.web"
                        : "chat.general",
                    )}
                  </span>
                )}
                {!!m.sources?.length && (
                  <footer className="chat-citations">
                    <span>{t("chat.sources")}</span>
                    <ul className="chat-sources" aria-label={t("chat.sources")}>
                      {m.sources.map((s, j) => (
                        <li key={j}>
                          {s.siteId ? (
                            <button
                              type="button"
                              className="chat-source-link"
                              aria-label={t("chat.openSite", { name: s.title })}
                              onClick={() => {
                                onClose();
                                if (s.siteId) onSite(s.siteId);
                              }}
                            >
                              <span>{s.title}</span>
                              <ArrowUpRight size={14} aria-hidden="true" />
                            </button>
                          ) : chatSourceUrl(s.url) ? (
                            <a
                              className="chat-source-link"
                              href={chatSourceUrl(s.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>{s.title}</span>
                              <ArrowUpRight size={14} aria-hidden="true" />
                            </a>
                          ) : (
                            <span>{s.title}</span>
                          )}
                          {s.source && (
                            <small>
                              {chatSourceUrl(s.source.url) ? (
                                <a
                                  href={chatSourceUrl(s.source.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {s.source.title}
                                </a>
                              ) : (
                                s.source.title
                              )}
                              {s.source.page && `, ${s.source.page}`}
                            </small>
                          )}
                        </li>
                      ))}
                    </ul>
                  </footer>
                )}
                {m.webUnavailable && (
                  <small className="chat-web-note">
                    {t("chat.webUnavailable")}
                  </small>
                )}
                {m.searchSuggestions && (
                  <iframe
                    className="chat-search-suggestions"
                    title={t("chat.searchSuggestions")}
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    referrerPolicy="no-referrer"
                    srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'">${m.searchSuggestions}`}
                  />
                )}
              </li>
            ))}
            {pending && (
              <li className="chat-msg assistant pending">
                {t("chat.thinking")}
              </li>
            )}
          </ol>
          <div className="chat-composer">
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
                readOnly={pending}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button
                type="submit"
                className="btn"
                disabled={pending || !draft.trim()}
                aria-label={t("chat.send")}
              >
                <Send size={18} />
              </button>
            </form>
            <p className="chat-note">{t("chat.note")}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
