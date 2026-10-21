import { reduceSnapshot, type Command, type Snapshot } from "@akar/domain";
import { createSeed } from "./seed";
export { routes, createSeed, demoRegion } from "./seed";
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
/** UI depends only on this contract. Replace with a backend implementation later. */
export interface AkarClient {
  getSnapshot(): Promise<Snapshot>;
  dispatch(command: Command): Promise<Snapshot>;
  reset(): Promise<Snapshot>;
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
export function createMockClient(storage?: StorageAdapter): AkarClient {
  let state = createSeed();
  try {
    const raw = storage?.getItem(key);
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (validSnapshot(saved)) state = saved;
    }
  } catch {
    /* Corrupt storage falls back to the demo seed. */
  }
  const persist = (next: Snapshot) => {
    try {
      storage?.setItem(key, JSON.stringify(next));
    } catch {
      throw new Error(
        "Tarayıcı depolaması dolu veya kapalı. Fotoğrafı küçültüp yeniden dene.",
      );
    }
    state = next;
    return structuredClone(state);
  };
  return {
    async getSnapshot() {
      return structuredClone(state);
    },
    async dispatch(command) {
      return persist(reduceSnapshot(state, command));
    },
    async reset() {
      return persist(createSeed());
    },
  };
}
