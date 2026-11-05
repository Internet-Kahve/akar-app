"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import type { WeeklyLeaderboard } from "@akar/domain";
import { avatarById } from "../lib/avatars";
import { weekRange } from "../lib/share-card";
import { Avatar, useAvatar } from "./avatar";
import { useI18n } from "./i18n";
import { Tag } from "./ui";

type Row = WeeklyLeaderboard["items"][number];

/** The visitor's own row shows the figure on this device (the demo's rows, or an account's not yet saved one). */
function RowAvatar({ row, size, own }: { row: Row; size: number; own?: boolean | undefined }) {
  const [mine] = useAvatar();
  const figure = own ? mine : avatarById(row.avatarId);
  if (figure) return <Avatar figure={figure} size={size} />;
  return (
    <span className="figure-avatar board-initial" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      <b>{row.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</b>
    </span>
  );
}

/**
 * «Haftanın Gezgini» (5 Nov 2026): the week's first, a podium for the first three, the rest of the ten and the
 * visitor's own place. Appearing on it is a choice (off by default, KVKK); the score is the server's ledger. The demo
 * shows made-up rows tagged «Örnek»; the live list never does, and when it is empty it invites the visitor to be first.
 */
export function WeeklyBoard({
  mode,
  load,
  setVisible,
  onSignIn,
}: {
  /** `account`: signed in; `guest`: live without an account; `demo`: no API. */
  mode: "account" | "guest" | "demo";
  load: () => Promise<WeeklyLeaderboard>;
  setVisible: (visible: boolean) => Promise<boolean>;
  onSignIn?: (() => void) | undefined;
}) {
  const { lang, t } = useI18n();
  const [board, setBoard] = useState<WeeklyLeaderboard | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Read once when the profile opens and after a change of the switch, not on every render of the page.
  const loader = useRef(load);
  loader.current = load;
  const read = useCallback(() => {
    setFailed(false);
    loader.current().then(setBoard, () => setFailed(true));
  }, []);
  useEffect(read, [read]);

  const toggle = async (visible: boolean) => {
    setBusy(true);
    setError("");
    try {
      await setVisible(visible);
      read();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("board.toggleFailed"));
    } finally {
      setBusy(false);
    }
  };

  const items = board?.items ?? [];
  const [first, second, third] = items;
  const rest = items.slice(3);
  const me = board?.me;
  const isMe = (row: Row) => !!me?.visible && me.rank === row.rank;
  return (
    <section className="card weekly-board" aria-labelledby="weekly-board-title">
      <div className="row between">
        <h3 id="weekly-board-title">
          <Trophy size={18} aria-hidden="true" /> {t("board.title")}
        </h3>
        {board?.sample && <Tag tone="muted">{t("board.sample")}</Tag>}
      </div>
      {board && <p className="muted board-week">{t("board.week", { range: weekRange(new Date(board.weekStart), lang) })}</p>}
      {failed ? (
        <p className="muted">
          {t("board.failed")}{" "}
          <button className="text-btn" onClick={read}>
            {t("board.retry")}
          </button>
        </p>
      ) : !board ? (
        <p className="muted" aria-busy="true">
          {t("board.loading")}
        </p>
      ) : !first ? (
        <div className="board-empty">
          <span aria-hidden="true">
            <Trophy size={30} />
          </span>
          <b>{t("board.emptyTitle")}</b>
          <p className="muted">{t("board.emptyText")}</p>
        </div>
      ) : (
        <>
          <div className="board-champion">
            <span className="board-champion-ring">
              <RowAvatar row={first} size={88} own={isMe(first)} />
            </span>
            <span>
              <small>{t("board.champion")}</small>
              <b>{first.name}</b>
              <em>{t("board.points", { points: first.points })}</em>
            </span>
          </div>
          <ol className="board-podium" aria-label={t("board.podium")}>
            {[second, first, third].map((row, i) =>
              row ? (
                <li key={row.rank} className={`place-${row.rank}`} style={{ order: i }}>
                  <RowAvatar row={row} size={row.rank === 1 ? 56 : 46} own={isMe(row)} />
                  <b>{row.name}</b>
                  <small>{t("board.points", { points: row.points })}</small>
                  <span className="board-step" aria-label={t("board.rank", { rank: row.rank })}>
                    {row.rank}
                  </span>
                </li>
              ) : (
                <li key={`empty-${i}`} className="empty" style={{ order: i }} aria-hidden="true" />
              ),
            )}
          </ol>
          {rest.length > 0 && (
            <ol className="board-list" start={4}>
              {rest.map((row) => (
                <li key={row.rank}>
                  <span className="board-rank">{row.rank}</span>
                  <RowAvatar row={row} size={32} own={isMe(row)} />
                  <b>{row.name}</b>
                  <span className="muted">{t("board.points", { points: row.points })}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      {board && me && (
        <p className="board-me">
          {me.visible && me.rank
            ? t("board.meRank", { rank: me.rank, points: me.points })
            : me.visible
              ? t("board.meNoPoints")
              : t("board.meHidden", { points: me.points })}
        </p>
      )}
      {mode === "guest" ? (
        <button className="btn secondary board-join" onClick={onSignIn}>
          {t("board.signIn")}
        </button>
      ) : (
        board?.me && (
          <label className="board-toggle">
            <span>
              <b>{t("board.toggle")}</b>
              <small className="muted">{t("board.toggleNote")}</small>
            </span>
            <input type="checkbox" role="switch" checked={board.me.visible} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
          </label>
        )
      )}
      {error && (
        <p className="error" role="status">
          {error}
        </p>
      )}
    </section>
  );
}
