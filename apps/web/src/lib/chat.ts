import type { ChatTurn } from "@akar/api-client";

/** `POST /v1/chat` limits (services/api/src/modules/chat/schemas.ts): longer requests are refused with 400. */
export const CHAT_MESSAGE_MAX = 500;
export const CHAT_HISTORY_MAX = 10;
export const CHAT_TURN_MAX = 2000;

/**
 * The earlier messages sent as context: the latest `CHAT_HISTORY_MAX`, oldest first, each cut to `CHAT_TURN_MAX`
 * characters (a long answer would otherwise make the next question fail), empty ones left out.
 */
export function chatHistory(turns: readonly ChatTurn[]): ChatTurn[] {
  return turns
    .map((turn) => ({ role: turn.role, text: turn.text.trim().slice(0, CHAT_TURN_MAX).trim() }))
    .filter((turn) => turn.text)
    .slice(-CHAT_HISTORY_MAX);
}
