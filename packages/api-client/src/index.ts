import {
  reduceSnapshot,
  defaultMapSettings,
  type CityScene,
  type Command,
  type MapPlacement,
  type MapSettings,
  type Snapshot,
  type HeritageSite,
  type Memory,
  type Role,
} from "@akar/domain";
import { createSeed, demoCityScenes, demoQuizzes } from "./seed";
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
/** `GET /v1/admin/health` (decisions §11.21, §11.25): panel warnings for moderators and admins. */
export interface AdminHealth {
  /** Memories pending longer than `thresholdHours`, counted from when they last entered the queue (submission or a report sending them back; the demo has no reports, so submission). */
  pendingStale: {
    count: number;
    oldestPendingSince: string | null;
    thresholdHours: number;
  };
  /** Admins only; absent for moderators and in the demo, which stores no files. */
  storage?: {
    usedBytes: number;
    quotaBytes: number;
    /** One decimal; may exceed 100. */
    percent: number;
    level: "ok" | "warn" | "critical";
    byKind: { photo: number; model: number; audio: number };
  };
}
/** Hours after which a pending memory counts as stale (`PENDING_STALE_HOURS` server-side). */
const PENDING_STALE_HOURS = 48;
/** UI depends only on this contract: the local demo client or the HTTP client behind it. */
export type ModerationPage = { items: Memory[]; nextCursor: string | null };
export interface AdminMember {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}
export interface MemberPage {
  items: AdminMember[];
  page: number;
  nextPage: number | null;
}
export interface AkarClient {
  getSnapshot(): Promise<Snapshot>;
  /**
   * Re-reads the published catalog (sites, models and their placements, routes, feed) and returns the
   * new snapshot. Concurrent calls share one read; a failed read keeps the data the client already has.
   */
  refreshCatalog(): Promise<Snapshot>;
  /** `GET /v1/map-settings`: when the map loads models and how many it draws. */
  getMapSettings(): Promise<MapSettings>;
  /** `PUT /v1/admin/map-settings`, admin only: returns the saved values. */
  setMapSettings(settings: MapSettings): Promise<MapSettings>;
  /** `GET /v1/cities`: 3D light and viewer background by city name; a city without a saved scene is absent. */
  getCityScenes(): Promise<Record<string, CityScene>>;
  /**
   * The placement saved for a site's model, `visible: false` included (the catalog hides it then); `null`
   * when none was saved. Panel read: the editor asks when it opens.
   */
  getMapPlacement(siteId: string): Promise<MapPlacement | null>;
  dispatch(command: Command): Promise<Snapshot>;
  /** Save and return the canonical site, including server ids and media URLs. */
  saveSite(
    site: HeritageSite,
  ): Promise<{ site: HeritageSite; snapshot: Snapshot }>;
  reset(): Promise<Snapshot>;
  /** Playable quizzes of a published site, in order; [] when it has none. */
  getQuizzes(siteId: string): Promise<PlayableQuiz[]>;
  answerQuiz(quizId: string, choice: number): Promise<QuizAnswerResult>;
  /** Shows the correct option; the quiz can no longer earn points. */
  revealQuiz(
    quizId: string,
  ): Promise<{ correctOption: string; snapshot: Snapshot }>;
  /** Moderator and admin only; the server answers 403 for other roles. */
  getAdminHealth(): Promise<AdminHealth>;
  getMembers(query: string, page: number): Promise<MemberPage>;
  setMemberRole(
    userId: string,
    role: Role,
    expectedRole: Role,
  ): Promise<AdminMember>;
  getModerationPage(
    status: Memory["status"],
    cursor?: string,
  ): Promise<ModerationPage>;
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
  const members: AdminMember[] = [
    {
      userId: "demo-admin",
      email: "yonetici@example.com",
      displayName: "Demo Yönetici",
      role: "admin",
      emailConfirmed: true,
      createdAt: "2026-10-01T12:00:00Z",
      lastSignInAt: null,
    },
    {
      userId: "demo-member",
      email: "uye@example.com",
      displayName: "Demo Üye",
      role: "user",
      emailConfirmed: true,
      createdAt: "2026-10-02T12:00:00Z",
      lastSignInAt: null,
    },
    {
      userId: "demo-pending",
      email: "bekleyen@example.com",
      displayName: null,
      role: "user",
      emailConfirmed: false,
      createdAt: "2026-10-03T12:00:00Z",
      lastSignInAt: null,
    },
  ];
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
  // Demo: a change lasts until the page reloads, like the demo member roles.
  let mapSettings: MapSettings = { ...defaultMapSettings };
  return {
    async getSnapshot() {
      return structuredClone(state);
    },
    async refreshCatalog() {
      return structuredClone(state);
    },
    async getMapSettings() {
      return { ...mapSettings };
    },
    async setMapSettings(settings) {
      mapSettings = { ...settings };
      return { ...mapSettings };
    },
    async getCityScenes() {
      return structuredClone(demoCityScenes);
    },
    async getMapPlacement(siteId) {
      return structuredClone(
        state.sites.find((s) => s.id === siteId)?.model?.placement ?? null,
      );
    },
    async dispatch(command) {
      return persist(reduceSnapshot(state, command));
    },
    async getModerationPage(status, cursor) {
      const items = state.memories.filter((m) => m.status === status);
      const start = Number(cursor ?? 0);
      return {
        items: structuredClone(items.slice(start, start + 25)),
        nextCursor: items.length > start + 25 ? String(start + 25) : null,
      };
    },
    async saveSite(site) {
      const snapshot = persist(reduceSnapshot(state, { type: "site", site }));
      return { site: snapshot.sites.find((s) => s.id === site.id)!, snapshot };
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
    async getMembers(query, page) {
      const filtered = members.filter((member) =>
        member.email?.toLowerCase().includes(query.toLowerCase()),
      );
      return {
        items: structuredClone(filtered.slice((page - 1) * 25, page * 25)),
        page,
        nextPage: filtered.length > page * 25 ? page + 1 : null,
      };
    },
    async setMemberRole(userId, role, expectedRole) {
      const member = members.find((item) => item.userId === userId);
      if (!member) throw new Error("Üye bulunamadı.");
      if (userId === "demo-admin")
        throw new Error("Kendi rolünü değiştiremezsin.");
      if (member.role !== expectedRole)
        throw new Error("Üyenin rolü değişti. Listeyi yenile.");
      if (role !== "user" && !member.emailConfirmed)
        throw new Error("Üye e-posta adresini doğrulamalı.");
      member.role = role;
      return structuredClone(member);
    },
    async getAdminHealth() {
      const cutoff = Date.now() - PENDING_STALE_HOURS * 3_600_000;
      const stale = (state.moderationQueue ?? state.memories)
        .filter(
          (m) => m.status === "pending" && Date.parse(m.createdAt) < cutoff,
        )
        .map((m) => m.createdAt)
        .sort((a, b) => Date.parse(a) - Date.parse(b));
      return {
        pendingStale: {
          count: stale.length,
          oldestPendingSince: stale[0] ?? null,
          thresholdHours: PENDING_STALE_HOURS,
        },
      };
    },
  };
}
