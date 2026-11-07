import { z } from "zod";

/**
 * Why a runner call failed. `busy`: another job is running (`jobId`); `not-found`: the runner does not know the job
 * (it keeps jobs in memory only, a restart forgets them); `unknown-site`: the runner has no model folder for the slug;
 * `failed`: unreachable, timed out, refused our secret or answered something we cannot read.
 */
export class RunnerError extends Error {
  readonly kind: "busy" | "not-found" | "unknown-site" | "failed";
  readonly jobId: string | undefined;
  constructor(kind: RunnerError["kind"], message: string, jobId?: string) {
    super(message);
    this.kind = kind;
    this.jobId = jobId;
  }
}

export const RUNNER_EVENT_TYPES = ["start", "text", "tool", "export", "step"] as const;

/** A package job's files: the day and night models and the map's baked day and night files. */
export const PACKAGE_ROLES = ["day", "night", "mapDay", "mapNight"] as const;

/** Version numbers may arrive as text or number; the API keeps text. */
const text = z.union([z.string(), z.number()]).nullish().transform((v) => (v == null ? null : String(v)));
/** The runner stamps times as Unix epoch milliseconds; the API keeps ISO text. */
const time = z.number().nullish().transform((v) => (v == null ? null : new Date(v).toISOString()));

const RunnerEvent = z.object({
  t: z.number(),
  type: z.enum(RUNNER_EVENT_TYPES),
  text: z.string().nullish().transform((v) => v ?? null),
  name: z.string().nullish().transform((v) => v ?? null),
  summary: z.string().nullish().transform((v) => v ?? null),
});
export type RunnerEvent = z.infer<typeof RunnerEvent>;

const RunnerJobSchema = z.object({
  id: z.string().min(1),
  /** `package` = a package job; edit jobs carry no kind. */
  kind: z.string().nullish().transform((v) => v ?? null),
  status: z.enum(["running", "succeeded", "failed"]),
  startedAt: time,
  finishedAt: time,
  reply: z.string().nullish().transform((v) => v ?? null),
  error: z.string().nullish().transform((v) => v ?? null),
  version: text,
  warnings: z.array(z.string()).nullish().transform((v) => v ?? []),
  usage: z
    .object({ turns: z.number(), durationMs: z.number(), costUsd: z.number() })
    .nullish()
    .transform((v) => v ?? null),
  files: z
    .array(
      z.object({
        name: z.string(),
        bytes: z.number(),
        url: z.string().nullish().transform((v) => v ?? null),
        role: z.enum(PACKAGE_ROLES).nullish().transform((v) => v ?? null),
      }),
    )
    .nullish()
    .transform((v) => v ?? []),
  /** A package job's checks of the baked files against the lit ones, per theme. */
  checks: z
    .array(z.object({ theme: z.enum(["day", "night"]), passed: z.boolean() }))
    .nullish()
    .transform((v) => v ?? []),
  // An event type this API does not know is dropped, not an error: the runner may grow new kinds.
  events: z
    .array(z.unknown())
    .nullish()
    .transform((v) => (v ?? []).flatMap((e) => {
      const parsed = RunnerEvent.safeParse(e);
      return parsed.success ? [parsed.data] : [];
    })),
});
export type RunnerJob = z.infer<typeof RunnerJobSchema>;

const RunnerAuthStatus = z.object({
  loggedIn: z.boolean(),
  plan: z.string().nullish().transform((v) => v ?? null),
  expiresAt: z.string().nullish().transform((v) => v ?? null),
});
export type RunnerAuthStatus = z.infer<typeof RunnerAuthStatus>;

/** The model runner behind an interface: the HTTP service in production, a local fake server in tests. */
export interface ModelRunner {
  authStatus(): Promise<RunnerAuthStatus>;
  /** Starts a job. Throws `RunnerError` (`busy`, `unknown-site`, `failed`). */
  createJob(input: { site: string; prompt: string; newSession?: boolean | undefined }): Promise<{ id: string }>;
  /** Starts a package job for an exported version. Throws `RunnerError` (`busy`, `unknown-site`, `not-found` = version not exported, `failed`). */
  createPackage(input: { site: string; version: string }): Promise<{ id: string }>;
  /** Throws `RunnerError` (`not-found` when the runner restarted, `failed`). */
  getJob(id: string): Promise<RunnerJob>;
  /** Absolute link the browser can open for a relative signed path the runner returned. */
  publicUrl(path: string): string;
}

const REQUEST_TIMEOUT_MS = 10_000;
const TRAILING_SLASHES = /\/+$/;

export function httpModelRunner(
  cfg: { baseUrl: string; secret: string; publicUrl?: string | undefined },
  fetchImpl: typeof fetch = fetch,
): ModelRunner {
  const base = cfg.baseUrl.replace(TRAILING_SLASHES, "");
  const publicBase = (cfg.publicUrl ?? cfg.baseUrl).replace(TRAILING_SLASHES, "");

  async function call(method: "GET" | "POST", path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
    let res: Response;
    try {
      res = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${cfg.secret}`,
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        body: body === undefined ? null : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new RunnerError("failed", "Model çalıştırıcıya ulaşılamadı.");
    }
    const json: unknown = await res.json().catch(() => null);
    return { status: res.status, json };
  }

  const unreadable = () => new RunnerError("failed", "Model çalıştırıcı beklenmeyen bir yanıt verdi.");
  const rejected = (status: number) => new RunnerError("failed", `Model çalıştırıcı isteği reddetti (HTTP ${status}).`);
  function started({ status, json }: { status: number; json: unknown }): { id: string } {
    if (status === 409) {
      const jobId = (json as { jobId?: unknown } | null)?.jobId;
      throw new RunnerError("busy", "Model çalıştırıcı başka bir işle meşgul.", typeof jobId === "string" ? jobId : undefined);
    }
    if (status === 400) throw new RunnerError("unknown-site", "Model çalıştırıcı bu eseri tanımıyor.");
    if (status !== 202 && status !== 200 && status !== 201) throw rejected(status);
    const id = (json as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !id) throw unreadable();
    return { id };
  }

  return {
    async authStatus() {
      const { status, json } = await call("GET", "/auth/status");
      if (status !== 200) throw rejected(status);
      const parsed = RunnerAuthStatus.safeParse(json);
      if (!parsed.success) throw unreadable();
      return parsed.data;
    },

    async createJob(input) {
      return started(await call("POST", "/jobs", input));
    },

    async createPackage(input) {
      const res = await call("POST", "/packages", input);
      if (res.status === 404) throw new RunnerError("not-found", "Bu sürüm çalıştırıcıda dışa aktarılmamış.");
      return started(res);
    },

    async getJob(id) {
      const { status, json } = await call("GET", `/jobs/${encodeURIComponent(id)}`);
      if (status === 404) throw new RunnerError("not-found", "Model çalıştırıcı bu işi tanımıyor.");
      if (status !== 200) throw rejected(status);
      const parsed = RunnerJobSchema.safeParse(json);
      if (!parsed.success) throw unreadable();
      return parsed.data;
    },

    publicUrl(path) {
      return /^https?:\/\//i.test(path) ? path : `${publicBase}${path.startsWith("/") ? "" : "/"}${path}`;
    },
  };
}

/** The runner of this deployment, or null when `MODEL_RUNNER_URL` or `MODEL_RUNNER_SECRET` is missing. */
export function modelRunnerFromConfig(config: {
  MODEL_RUNNER_URL?: string | undefined;
  MODEL_RUNNER_SECRET?: string | undefined;
  MODEL_RUNNER_PUBLIC_URL?: string | undefined;
}): ModelRunner | null {
  if (!config.MODEL_RUNNER_URL || !config.MODEL_RUNNER_SECRET) return null;
  return httpModelRunner({ baseUrl: config.MODEL_RUNNER_URL, secret: config.MODEL_RUNNER_SECRET, publicUrl: config.MODEL_RUNNER_PUBLIC_URL });
}
