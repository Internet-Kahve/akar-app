import { reduceSnapshot, type Command, type Snapshot } from "@akar/domain";
import { createSeed, demoQuizzes } from "./seed";
export { routes, createSeed, demoRegion, demoQuizzes } from "./seed";
export {
  createHttpClient,
  ApiError,
  UnsupportedCommandError,
  httpStorageKey,
  type HttpClientOptions,
} from "./http";
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
/** A quiz as the player sees it: never the answer key. */
export interface PlayableQuiz {
  id: string;
  siteId: string;
  question: string;
  /** Exactly 3 options. */
  options: string[];
  /** Only after a wrong answer (server rule). */
  hint: string | null;
  solved: boolean;
  /** "Cevabı göster" used: no more points. */
  revealed: boolean;
}
export interface QuizAnswerResult {
  correct: boolean;
  /** Points earned now (guest: pending receipt points), 0 if none. */
  awarded: number;
  /** Unlocked hint after a wrong answer. */
  hint: string | null;
  /** Shown after a correct answer. */
  explanation: string | null;
  /** Fresh state (points, quizIds). */
  snapshot: Snapshot;
}
/** UI depends only on this contract: the local demo client or the HTTP client behind it. */
export interface AkarClient {
  getSnapshot(): Promise<Snapshot>;
  dispatch(command: Command): Promise<Snapshot>;
  reset(): Promise<Snapshot>;
  /** Playable quizzes of a published site, in order; [] when it has none. */
  getQuizzes(siteId: string): Promise<PlayableQuiz[]>;
  answerQuiz(quizId: string, choice: number): Promise<QuizAnswerResult>;
  /** Shows the correct option; the quiz can no longer earn points. */
  revealQuiz(
    quizId: string,
  ): Promise<{ correctOption: string; snapshot: Snapshot }>;
}
// Keep the previous Istanbul demo untouched in its original storage key.
export const demoStorageKey = "akar-demo-bursa-v1";
const key = demoStorageKey;
function validSnapshot(s: unknown): s is Snapshot {
  if (!s || typeof s !== "object") return false;
  const v = s as Snapshot;
  return (
    v.version === 1 &&
    Array.isArray(v.sites) &&
    v.sites.every(
      (x) =>
        typeof x.name === "string" &&
        Array.isArray(x.coordinates) &&
        Array.isArray(x.stories),
    ) &&
    [
      "savedIds",
      "routeIds",
      "visitedIds",
      "readIds",
      "quizIds",
      "memories",
    ].every((k) => Array.isArray(v[k as keyof Snapshot])) &&
    Number.isFinite(v.points) &&
    typeof v.name === "string"
  );
}
interface QuizProgress {
  solved: boolean;
  revealed: boolean;
  wrong: number;
}
/** Points per correct quiz, like the server's `quiz.correct`. */
const QUIZ_POINTS = 20;
const quizIdOf = (siteId: string, n: number) => `${siteId}:quiz-${n + 1}`;
export function createMockClient(storage?: StorageAdapter): AkarClient {
  let state = createSeed();
  let progress: Record<string, QuizProgress> = {};
  try {
    const raw = storage?.getItem(key);
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (validSnapshot(saved)) {
        // Older saves have no `quizProgress`; the extra field is not part of the snapshot.
        const { quizProgress, ...snapshot } = saved as Snapshot & {
          quizProgress?: Record<string, QuizProgress>;
        };
        state = snapshot;
        if (quizProgress && typeof quizProgress === "object")
          progress = quizProgress;
      }
    }
  } catch {
    /* Corrupt storage falls back to the demo seed. */
  }
  const persist = (next: Snapshot, nextProgress = progress) => {
    try {
      storage?.setItem(
        key,
        JSON.stringify({ ...next, quizProgress: nextProgress }),
      );
    } catch {
      throw new Error(
        "Tarayıcı depolaması dolu veya kapalı. Fotoğrafı küçültüp yeniden dene.",
      );
    }
    state = next;
    progress = nextProgress;
    return structuredClone(state);
  };
  const stateOf = (quizId: string): QuizProgress =>
    progress[quizId] ?? { solved: false, revealed: false, wrong: 0 };
  const find = (quizId: string) => {
    const at = quizId.lastIndexOf(":quiz-");
    const siteId = quizId.slice(0, at);
    const n = Number(quizId.slice(at + ":quiz-".length)) - 1;
    const quiz = at > 0 ? demoQuizzes[n] : undefined;
    if (
      !quiz ||
      quizIdOf(siteId, n) !== quizId ||
      !state.sites.some((s) => s.id === siteId && s.status === "published")
    )
      throw new Error("Bulmaca bulunamadı.");
    return { siteId, quiz };
  };
  return {
    async getSnapshot() {
      return structuredClone(state);
    },
    async dispatch(command) {
      return persist(reduceSnapshot(state, command));
    },
    async reset() {
      return persist(createSeed(), {});
    },
    async getQuizzes(siteId) {
      if (!state.sites.some((s) => s.id === siteId && s.status === "published"))
        return [];
      return demoQuizzes.map((q, n) => {
        const id = quizIdOf(siteId, n);
        const p = stateOf(id);
        return {
          id,
          siteId,
          question: q.question,
          options: [...q.options],
          hint: p.wrong > 0 ? q.hint : null,
          solved: p.solved,
          revealed: p.revealed,
        };
      });
    },
    async answerQuiz(quizId, choice) {
      const { siteId, quiz } = find(quizId);
      if (!Number.isInteger(choice) || choice < 0 || choice > 2)
        throw new Error("Geçerli bir şık seç.");
      const p = stateOf(quizId);
      if (choice !== quiz.correct) {
        const snapshot = persist(state, {
          ...progress,
          [quizId]: { ...p, wrong: p.wrong + 1 },
        });
        return {
          correct: false,
          awarded: 0,
          hint: quiz.hint,
          explanation: null,
          snapshot,
        };
      }
      const earned = !p.solved && !p.revealed;
      const next: Snapshot = { ...state, quizIds: [...state.quizIds] };
      if (earned) {
        next.points += QUIZ_POINTS;
        if (!next.quizIds.includes(siteId)) next.quizIds.push(siteId);
      }
      const snapshot = persist(next, {
        ...progress,
        [quizId]: { ...p, solved: true },
      });
      return {
        correct: true,
        awarded: earned ? QUIZ_POINTS : 0,
        hint: null,
        explanation: quiz.explanation,
        snapshot,
      };
    },
    async revealQuiz(quizId) {
      const { quiz } = find(quizId);
      const snapshot = persist(state, {
        ...progress,
        [quizId]: { ...stateOf(quizId), revealed: true },
      });
      return {
        correctOption: quiz.options[quiz.correct],
        snapshot,
      };
    },
  };
}
