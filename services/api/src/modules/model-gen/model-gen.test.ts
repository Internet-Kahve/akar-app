import type { HeritageSite } from "@akar/domain";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import type { App } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import { auditLog, modelGenJobs, usageDaily } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import type { ModelGenJobDto } from "./schemas.ts";

const SECRET = "runner-secret-for-tests";
const PUBLIC_URL = "https://runner.example.test";
const SITE = "orhan-gazi-turbesi";

const site = (id: string, name: string): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Osmangazi",
  year: "1326",
  architect: "",
  kind: "turbe",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: `${name} açıklaması`,
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Yapım", text: "Metin.", simple: "Sade", trust: "verified" }],
  source: "test",
  tier: "Tier 2",
});

/** A stand-in for the model runner: the contract of the real service, with state the tests set directly. */
type RunnerJobState = Record<string, unknown> & { id: string };
const runner = {
  server: undefined as unknown as Server,
  url: "",
  jobs: new Map<string, RunnerJobState>(),
  created: [] as Record<string, unknown>[],
  reads: 0,
  busy: false,
  unauthorized: 0,
  next: 1,
  reset() {
    this.jobs.clear();
    this.created.length = 0;
    this.reads = 0;
    this.busy = false;
    this.unauthorized = 0;
    this.next = 1;
  },
};

async function startRunner(): Promise<void> {
  runner.server = createServer((req, res) => {
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.headers.authorization !== `Bearer ${SECRET}`) {
      runner.unauthorized++;
      return send(401, { error: "unauthorized" });
    }
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const body = chunks.length ? (JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>) : {};
      if (req.method === "GET" && req.url === "/auth/status") {
        return send(200, { loggedIn: true, plan: "max", expiresAt: "2026-12-01T00:00:00.000Z" });
      }
      if (req.method === "POST" && req.url === "/jobs") {
        if (body.site === "bilinmeyen") return send(400, { error: "unknown site" });
        if (runner.busy) return send(409, { error: "busy", jobId: "r-busy" });
        runner.created.push(body);
        const id = `r-${runner.next++}`;
        const job = { id, site: body.site, prompt: body.prompt, status: "running", startedAt: Date.parse("2026-11-06T10:00:00.000Z"), events: [{ t: 0, type: "start" }] };
        runner.jobs.set(id, job);
        return send(202, { ...job, input: "in.blend", exported: false });
      }
      if (req.method === "POST" && req.url === "/packages") {
        if (runner.busy) return send(409, { error: "busy", jobId: "r-busy" });
        if (body.version !== "v21") return send(404, { error: "version not exported" });
        runner.created.push(body);
        const id = `00000000-0000-4000-8000-00000000000${runner.next++}`;
        const job = { id, kind: "package", site: body.site, version: body.version, status: "running", startedAt: Date.parse("2026-11-06T10:00:00.000Z"), events: [{ t: 0, type: "start" }] };
        runner.jobs.set(id, job);
        return send(202, job);
      }
      const m = /^\/jobs\/([^/]+)$/.exec(req.url ?? "");
      if (req.method === "GET" && m) {
        runner.reads++;
        const job = runner.jobs.get(m[1]!);
        return job ? send(200, job) : send(404, { error: "not found" });
      }
      send(404, { error: "no route" });
    });
  });
  runner.server.listen(0, "127.0.0.1");
  await once(runner.server, "listening");
  runner.url = `http://127.0.0.1:${(runner.server.address() as AddressInfo).port}`;
}

const finish = (id: string, patch: Record<string, unknown>) => {
  const job = runner.jobs.get(id)!;
  Object.assign(job, { status: "succeeded", finishedAt: Date.parse("2026-11-06T10:01:00.000Z"), ...patch });
};

let app: App;
let db: Db;
let stop: (() => Promise<void>) | undefined;
const admin = authHeader({ id: "admin-1", role: "admin" });

before(async () => {
  await startRunner();
  ({ app, stop } = await startTestApp({ env: { MODEL_RUNNER_URL: runner.url, MODEL_RUNNER_SECRET: SECRET, MODEL_RUNNER_PUBLIC_URL: PUBLIC_URL } }));
  db = app.deps.db;
  await loadCatalog(db, { sites: [site(SITE, "Orhan Gazi Türbesi"), site("Eski_Kimlik", "Eski kimlikli eser"), site("koza-han", "Koza Han")], routes: [] });
});
after(async () => {
  await stop?.();
  runner.server.close();
});
beforeEach(async () => {
  runner.reset();
  await db.delete(modelGenJobs);
  await db.delete(usageDaily);
});

const create = (payload: object, headers: Record<string, string> = admin, siteId = SITE) =>
  app.inject({ method: "POST", url: `/v1/admin/sites/${siteId}/model-gen/jobs`, payload, headers });
const poll = (id: string) => app.inject({ method: "GET", url: `/v1/admin/model-gen/jobs/${id}`, headers: admin });
const list = (query = "", siteId = SITE) => app.inject({ method: "GET", url: `/v1/admin/sites/${siteId}/model-gen/jobs${query}`, headers: admin });

test("without runner settings the endpoints answer 503, the status says it is off", async () => {
  const saved = { url: app.deps.config.MODEL_RUNNER_URL, secret: app.deps.config.MODEL_RUNNER_SECRET };
  Object.assign(app.deps.config, { MODEL_RUNNER_URL: undefined, MODEL_RUNNER_SECRET: undefined });
  try {
    const res = await create({ prompt: "Kubbeyi büyüt" });
    assert.equal(res.statusCode, 503);
    assert.equal(res.json().error.code, "MODEL_GEN_DISABLED");
    assert.equal((await poll(randomUUID())).statusCode, 503);
    const status = await app.inject({ method: "GET", url: "/v1/admin/model-gen/status", headers: admin });
    assert.equal(status.statusCode, 200);
    assert.deepEqual(status.json(), { enabled: false, loggedIn: false, plan: null, expiresAt: null });
  } finally {
    Object.assign(app.deps.config, { MODEL_RUNNER_URL: saved.url, MODEL_RUNNER_SECRET: saved.secret });
  }
});

test("only admins: guests get 401, editors, moderators and users 403, and nothing reaches the runner", async () => {
  const urls = [
    ["GET", "/v1/admin/model-gen/status"],
    ["POST", `/v1/admin/sites/${SITE}/model-gen/jobs`],
    ["GET", `/v1/admin/sites/${SITE}/model-gen/jobs`],
    ["GET", `/v1/admin/model-gen/jobs/${randomUUID()}`],
  ] as const;
  for (const [method, url] of urls) {
    const body = method === "POST" ? { payload: { prompt: "x" } } : {};
    assert.equal((await app.inject({ method, url, ...body })).statusCode, 401, `${method} ${url} guest`);
    for (const role of ["user", "editor", "moderator"] as const) {
      const res = await app.inject({ method, url, ...body, headers: authHeader({ id: `u-${role}`, role }) });
      assert.equal(res.statusCode, 403, `${method} ${url} ${role}`);
    }
  }
  assert.equal(runner.created.length, 0);
  assert.equal(runner.reads, 0);
});

test("the status passes the runner's Claude login through", async () => {
  const res = await app.inject({ method: "GET", url: "/v1/admin/model-gen/status", headers: admin });
  assert.deepEqual(res.json(), { enabled: true, loggedIn: true, plan: "max", expiresAt: "2026-12-01T00:00:00.000Z" });
  assert.equal(runner.unauthorized, 0, "the runner is called with the bearer secret");
});

test("creating a job sends the prompt to the runner with the site slug, stores the row, audits and counts it", async () => {
  const res = await create({ prompt: "  Kubbeyi büyüt  ", newSession: true });
  assert.equal(res.statusCode, 202, res.body);
  const job = res.json<ModelGenJobDto>();
  assert.deepEqual(runner.created, [{ site: SITE, prompt: "Kubbeyi büyüt", newSession: true }]);
  assert.equal(job.status, "running");
  assert.equal(job.siteId, SITE);
  assert.equal(job.createdBy, "admin-1");
  assert.equal(job.prompt, "Kubbeyi büyüt");

  const [row] = await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, job.id));
  assert.equal(row?.runnerJobId, "r-1");
  assert.equal(row?.userId, "admin-1");
  const audit = await db.select().from(auditLog).where(eq(auditLog.action, "model-gen.job"));
  assert.equal(audit.length, 1);
  assert.equal(audit[0]?.entityId, SITE);
  const usage = await db.select().from(usageDaily).where(eq(usageDaily.event, "model_gen.job"));
  assert.deepEqual(usage.map((u) => [u.siteId, u.count]), [[SITE, 1]]);
});

test("the same Idempotency-Key starts one runner job", async () => {
  const headers = { ...admin, "idempotency-key": "anahtar-1" };
  const first = await create({ prompt: "Kubbeyi büyüt" }, headers);
  const second = await create({ prompt: "Kubbeyi büyüt" }, headers);
  assert.equal(first.statusCode, 202);
  assert.equal(second.statusCode, 202);
  assert.equal(second.json<ModelGenJobDto>().id, first.json<ModelGenJobDto>().id);
  assert.equal(runner.created.length, 1);
});

test("a busy runner is 409 MODEL_GEN_BUSY and nothing is stored", async () => {
  runner.busy = true;
  const res = await create({ prompt: "Kubbeyi büyüt" });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error.code, "MODEL_GEN_BUSY");
  assert.equal((await db.select().from(modelGenJobs)).length, 0);
});

test("a runner that cannot be reached is 502", async () => {
  const saved = app.deps.config.MODEL_RUNNER_URL;
  Object.assign(app.deps.config, { MODEL_RUNNER_URL: "http://127.0.0.1:1" });
  try {
    const res = await create({ prompt: "Kubbeyi büyüt" });
    assert.equal(res.statusCode, 502);
    assert.equal(res.json().error.code, "UPSTREAM_FAILED");
    assert.equal((await db.select().from(modelGenJobs)).length, 0);
  } finally {
    Object.assign(app.deps.config, { MODEL_RUNNER_URL: saved });
  }
});

test("unknown site 404, a site id the runner cannot take 400, a prompt outside 1..4000 characters 400", async () => {
  assert.equal((await create({ prompt: "x" }, admin, "yok")).statusCode, 404);
  const odd = await create({ prompt: "x" }, admin, "Eski_Kimlik");
  assert.equal(odd.statusCode, 400);
  assert.equal(odd.json().error.code, "MODEL_GEN_SITE_UNSUPPORTED");
  assert.equal((await create({ prompt: "   " })).statusCode, 400);
  assert.equal((await create({ prompt: "a".repeat(4001) })).statusCode, 400);
  assert.equal(runner.created.length, 0);
});

test("polling shows the live events of a running job, then stores the final state and returns absolute signed file links", async () => {
  const { id } = (await create({ prompt: "Kubbeyi büyüt" })).json<ModelGenJobDto>();
  runner.jobs.get("r-1")!.events = [{ t: 0, type: "start" }, { t: 900, type: "text", text: "Kubbeye bakıyorum" }, { t: 1500, type: "tool", name: "blender", summary: "scale" }];

  const running = (await poll(id)).json<ModelGenJobDto>();
  assert.equal(running.status, "running");
  assert.deepEqual(running.events.map((e) => e.type), ["start", "text", "tool"]);
  assert.equal(running.events[1]?.text, "Kubbeye bakıyorum");
  assert.equal((await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, id)))[0]?.status, "running");

  finish("r-1", {
    reply: "Kubbe %20 büyütüldü.",
    version: "v03",
    warnings: ["Yüzey sayısı arttı"],
    usage: { turns: 4, durationMs: 61000, costUsd: 0.42 },
    files: [{ name: "model_v03.glb", bytes: 123456, url: "/files/orhan/model_v03.glb?exp=1&sig=abc" }],
    events: [{ t: 0, type: "start" }, { t: 60000, type: "export" }],
  });
  const done = (await poll(id)).json<ModelGenJobDto>();
  assert.equal(done.status, "succeeded");
  assert.equal(done.reply, "Kubbe %20 büyütüldü.");
  assert.equal(done.version, "v03");
  assert.deepEqual(done.warnings, ["Yüzey sayısı arttı"]);
  assert.deepEqual(done.usage, { turns: 4, durationMs: 61000, costUsd: 0.42 });
  assert.deepEqual(done.files, [{ name: "model_v03.glb", bytes: 123456, url: `${PUBLIC_URL}/files/orhan/model_v03.glb?exp=1&sig=abc` }]);
  assert.equal(done.events.length, 2);
  assert.equal(done.finishedAt, "2026-11-06T10:01:00.000Z");

  // The signed link is never stored; the name and size are.
  const [row] = await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, id));
  assert.equal(row?.status, "succeeded");
  assert.deepEqual(row?.files, [{ name: "model_v03.glb", bytes: 123456 }]);
  assert.doesNotMatch(JSON.stringify(row), /sig=/);

  // History: stored state, no links and no events.
  const [listed] = (await list()).json<{ items: ModelGenJobDto[] }>().items;
  assert.equal(listed?.status, "succeeded");
  assert.deepEqual(listed?.files, [{ name: "model_v03.glb", bytes: 123456, url: null }]);
  assert.deepEqual(listed?.events, []);
});

test("a finished job is asked again only for fresh links; if the runner is gone the stored result stays", async () => {
  const { id } = (await create({ prompt: "Kubbeyi büyüt" })).json<ModelGenJobDto>();
  finish("r-1", { reply: "Tamam", files: [{ name: "m.glb", bytes: 10, url: "/files/m.glb?exp=1&sig=1" }] });
  await poll(id);
  runner.jobs.get("r-1")!.files = [{ name: "m.glb", bytes: 10, url: "/files/m.glb?exp=2&sig=2" }];
  assert.equal((await poll(id)).json<ModelGenJobDto>().files[0]?.url, `${PUBLIC_URL}/files/m.glb?exp=2&sig=2`);

  runner.jobs.clear();
  const after = (await poll(id)).json<ModelGenJobDto>();
  assert.equal(after.status, "succeeded");
  assert.equal(after.reply, "Tamam");
  assert.deepEqual(after.files, [{ name: "m.glb", bytes: 10, url: null }]);
});

test("a failed runner job is stored with its error", async () => {
  const { id } = (await create({ prompt: "Kubbeyi büyüt" })).json<ModelGenJobDto>();
  finish("r-1", { status: "failed", error: "Blender kapandı" });
  const done = (await poll(id)).json<ModelGenJobDto>();
  assert.equal(done.status, "failed");
  assert.equal(done.error, "Blender kapandı");
  assert.equal((await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, id)))[0]?.error, "Blender kapandı");
});

test("a runner that no longer knows the job turns it `lost`, and it is not asked again", async () => {
  const { id } = (await create({ prompt: "Kubbeyi büyüt" })).json<ModelGenJobDto>();
  runner.jobs.clear();
  const lost = (await poll(id)).json<ModelGenJobDto>();
  assert.equal(lost.status, "lost");
  assert.ok(lost.error);
  assert.ok(lost.finishedAt);
  assert.equal((await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, id)))[0]?.status, "lost");
  const reads = runner.reads;
  assert.equal((await poll(id)).json<ModelGenJobDto>().status, "lost");
  assert.equal(runner.reads, reads);
  assert.equal((await poll(randomUUID())).statusCode, 404);
});

test("the history is newest first, per site, and pages by cursor", async () => {
  const base = Date.parse("2026-11-06T09:00:00.000Z");
  const rows = await db
    .insert(modelGenJobs)
    .values([0, 1, 2].map((i) => ({ siteId: SITE, userId: "admin-1", prompt: `istem ${i}`, runnerJobId: `r-${i}`, createdAt: new Date(base + i * 1000) })))
    .returning();
  await db.insert(modelGenJobs).values({ siteId: "koza-han", userId: "admin-1", prompt: "başka eser", runnerJobId: "r-x" });
  assert.equal(rows.length, 3);

  const first = (await list("?limit=2")).json<{ items: ModelGenJobDto[]; nextCursor: string | null }>();
  assert.deepEqual(first.items.map((j) => j.prompt), ["istem 2", "istem 1"]);
  assert.ok(first.nextCursor);
  const second = (await list(`?limit=2&cursor=${first.nextCursor}`)).json<{ items: ModelGenJobDto[]; nextCursor: string | null }>();
  assert.deepEqual(second.items.map((j) => j.prompt), ["istem 0"]);
  assert.equal(second.nextCursor, null);
  assert.equal((await list("?cursor=bozuk")).statusCode, 400);
  assert.equal((await list("", "yok")).statusCode, 404);
});

const pack = (payload: object, siteId = SITE) =>
  app.inject({ method: "POST", url: `/v1/admin/sites/${siteId}/model-gen/packages`, payload, headers: admin });
const packPoll = (id: string) => app.inject({ method: "GET", url: `/v1/admin/model-gen/packages/${id}`, headers: admin });

test("a package job runs on the runner for the site and version; its four files come back by role with absolute links", async () => {
  const res = await pack({ version: "v21" });
  assert.equal(res.statusCode, 202, res.body);
  const { id } = res.json<{ id: string }>();
  assert.deepEqual(runner.created, [{ site: SITE, version: "v21" }]);
  finish(id, {
    events: [{ t: 0, type: "start" }, { t: 1, type: "step", name: "night" }, { t: 2, type: "step", name: "bake" }],
    checks: [{ theme: "day", passed: true }, { theme: "night", passed: true }],
    files: ["day", "night", "mapDay", "mapNight"].map((role) => ({ role, name: `${role}.glb`, bytes: 1, url: `/files/${role}.glb?sig=1` })),
  });
  const done = (await packPoll(id)).json<{ status: string; steps: string[]; files: { role: string; url: string }[] }>();
  assert.equal(done.status, "succeeded");
  assert.deepEqual(done.steps, ["night", "bake"]);
  assert.deepEqual(done.files.map((f) => [f.role, f.url]), ["day", "night", "mapDay", "mapNight"].map((r) => [r, `${PUBLIC_URL}/files/${r}.glb?sig=1`]));
});

test("a version the runner has not exported is 404; a busy runner 409; an edit job is not readable as a package", async () => {
  assert.equal((await pack({ version: "v99" })).json().error.code, "MODEL_GEN_VERSION_MISSING");
  assert.equal((await pack({ version: "21" })).statusCode, 400);
  runner.busy = true;
  assert.equal((await pack({ version: "v21" })).statusCode, 409);
  runner.jobs.set("00000000-0000-4000-8000-0000000000aa", { id: "00000000-0000-4000-8000-0000000000aa", status: "running" });
  assert.equal((await packPoll("00000000-0000-4000-8000-0000000000aa")).statusCode, 404);
});
