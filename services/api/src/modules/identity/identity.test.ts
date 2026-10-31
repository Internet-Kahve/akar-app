import { eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { after, before, beforeEach, test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import type { App } from "../../app.ts";
import { auditLog, profiles, staffInvites, staffMembers } from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import type { AuthVerifier } from "../../platform/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { identityRoutes } from "./routes.ts";
import type { InviteResponse, StaffInviteDto, StaffMemberDto } from "./schemas.ts";
import type { StaffRole } from "./service.ts";
import { createJwksVerifier } from "./verifier.ts";

const ISSUER = "https://auth.akar.test/auth/v1";
const AUDIENCE = "authenticated";
const KID = "akar-test-key";
const SUPABASE_URL = "http://supabase.test";
const SERVICE_KEY = "service-role-test-key";

// One signing key that the JWKS publishes and one that only the attacker holds.
const trusted = await generateKeyPair("ES256");
const attacker = await generateKeyPair("ES256");
const published = createLocalJWKSet({ keys: [{ ...(await exportJWK(trusted.publicKey)), kid: KID, alg: "ES256", use: "sig" }] });

// Lets a test simulate Supabase's key endpoint being unreachable.
let keysDown = false;
const jwks: JWTVerifyGetKey = (header, jwt) => {
  if (keysDown) throw new TypeError("fetch failed");
  return published(header, jwt);
};

let app: App;
let stop: (() => Promise<void>) | undefined;
let verifier: AuthVerifier | undefined;

before(async () => {
  // The harness creates the database, which the real verifier needs: delegate once it exists.
  const auth: AuthVerifier = { verify: (jwt) => verifier!.verify(jwt) };
  ({ app, stop } = await startTestApp({
    auth,
    register: [identityRoutes],
    env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY },
  }));
  verifier = createJwksVerifier({ jwks, issuer: ISSUER, audience: AUDIENCE, db: app.deps.db });
});
after(() => stop?.());

beforeEach(async () => {
  keysDown = false;
  await app.deps.db.execute(sql`truncate table staff_members, staff_invites, profiles, audit_log, idempotency_keys, deleted_accounts`);
});

type TokenOptions = {
  /** null leaves `sub` out. */
  sub?: string | null | undefined;
  email?: string | undefined;
  issuer?: string | undefined;
  audience?: string | undefined;
  /** Seconds until `exp` (negative = already expired); null leaves `exp` out. */
  expiresIn?: number | null | undefined;
  key?: CryptoKey | undefined;
  kid?: string | undefined;
  claims?: JWTPayload | undefined;
};

/** A Supabase-shaped access token signed with ES256. */
async function token(o: TokenOptions = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT({ role: "authenticated", ...(o.email ? { email: o.email } : {}), ...o.claims })
    .setProtectedHeader({ alg: "ES256", kid: o.kid ?? KID })
    .setIssuedAt(now - 5)
    .setIssuer(o.issuer ?? ISSUER)
    .setAudience(o.audience ?? AUDIENCE);
  if (o.sub !== null) jwt.setSubject(o.sub ?? "user-default");
  if (o.expiresIn !== null) jwt.setExpirationTime(now + (o.expiresIn ?? 3600));
  return jwt.sign(o.key ?? trusted.privateKey);
}

const bearer = (jwt: string) => ({ authorization: `Bearer ${jwt}` });
const login = async (sub: string, email?: string) => bearer(await token({ sub, email }));
const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

const call = (method: "GET" | "POST" | "PUT" | "DELETE", url: string, headers: Record<string, string> = {}, payload?: object) =>
  app.inject({ method, url, headers, ...(payload ? { payload } : {}) });

const roleOf = async (headers: Record<string, string>) => (await call("GET", "/v1/me", headers)).json<{ role: string }>().role;

const seedStaff = (userId: string, email: string, role: StaffRole) =>
  app.deps.db.insert(staffMembers).values({ userId, email, role, grantedBy: "seed" });

type Upstream = { url: string; method: string | undefined; apikey: string | null; authorization: string | null; body: unknown };

/** Replaces `fetch` so the Supabase admin API is never reached; `respond(n)` answers the n-th call. */
function mockSupabase(t: TestContext, respond: (n: number) => Response): Upstream[] {
  const calls: Upstream[] = [];
  t.mock.method(globalThis, "fetch", async (url: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(url),
      method: init?.method,
      apikey: headers.get("apikey"),
      authorization: headers.get("authorization"),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return respond(calls.length);
  });
  return calls;
}

test("tokens with a wrong issuer, audience, expiry, signature or algorithm are 401; an outage of the key set is not", async () => {
  const good = await token({ sub: "user-1", email: "one@akar.test" });
  assert.equal((await call("GET", "/v1/me", bearer(good))).statusCode, 200);

  const [header, , signature] = good.split(".");
  const stolen = { iss: ISSUER, aud: AUDIENCE, sub: "admin-1", exp: Math.floor(Date.now() / 1000) + 3600 };
  const rejected: Record<string, string> = {
    "wrong issuer": await token({ issuer: "https://evil.test/auth/v1" }),
    "wrong audience": await token({ audience: "anon" }),
    expired: await token({ expiresIn: -3600 }),
    "no expiry": await token({ expiresIn: null }),
    "no subject": await token({ sub: null }),
    "signed with another key": await token({ key: attacker.privateKey }),
    "unknown key id": await token({ kid: "attacker-key" }),
    "payload swapped, signature kept": `${header}.${b64(stolen)}.${signature}`,
    "alg none": `${b64({ alg: "none", typ: "JWT" })}.${b64(stolen)}.`,
    "HS256 with a guessed secret": await new SignJWT(stolen)
      .setProtectedHeader({ alg: "HS256", kid: KID })
      .sign(new TextEncoder().encode("0123456789abcdef0123456789abcdef")),
    garbage: "not-a-jwt",
  };
  for (const [label, jwt] of Object.entries(rejected)) {
    // /health is public, so a guest would get 200: the 401 proves the token itself was refused.
    const res = await call("GET", "/health", bearer(jwt));
    assert.equal(res.statusCode, 401, label);
    assert.equal(res.json<ErrorBody>().error.code, "UNAUTHENTICATED", label);
  }

  // Failing to fetch our own signing keys is a server problem, never "your session is invalid".
  keysDown = true;
  assert.equal((await call("GET", "/health", bearer(good))).statusCode, 500);
  assert.equal((await call("GET", "/health", bearer("not-a-jwt"))).statusCode, 401);
});

test("roles come from staff_members only; role claims in the token are ignored", async () => {
  const claims = {
    role: "admin",
    roles: ["admin"],
    app_metadata: { role: "admin", roles: ["admin"] },
    user_metadata: { role: "admin" },
  };
  const headers = bearer(await token({ sub: "user-claims", email: "claims@akar.test", claims }));

  assert.equal(await roleOf(headers), "user");
  const invite = await call("POST", "/v1/admin/staff/invites", headers, { email: "x@akar.test", role: "editor" });
  assert.equal(invite.statusCode, 403);

  // The table decides in both directions, from the very next request.
  await seedStaff("user-claims", "claims@akar.test", "editor");
  assert.equal(await roleOf(headers), "editor");
  await app.deps.db.delete(staffMembers).where(eq(staffMembers.userId, "user-claims"));
  assert.equal(await roleOf(headers), "user");
});

test("an open invite grants its role on the invitee's first request exactly once, even when requests race", async () => {
  await app.deps.db.insert(staffInvites).values({ id: "inv-1", email: "Ayse@Akar.Test", role: "moderator", invitedBy: "admin-1" });
  const headers = await login("user-ayse", "ayse@akar.test");

  const responses = await Promise.all(Array.from({ length: 12 }, () => call("GET", "/v1/me", headers)));
  for (const res of responses) {
    assert.equal(res.statusCode, 200);
    assert.equal(res.json<{ role: string }>().role, "moderator");
  }

  const members = await app.deps.db.select().from(staffMembers);
  assert.deepEqual(
    members.map((m) => ({ userId: m.userId, email: m.email, role: m.role, grantedBy: m.grantedBy })),
    [{ userId: "user-ayse", email: "ayse@akar.test", role: "moderator", grantedBy: "admin-1" }],
  );
  const [invite] = await app.deps.db.select().from(staffInvites);
  assert.equal(invite?.userId, "user-ayse");
  const grants = await app.deps.db.select().from(auditLog).where(eq(auditLog.action, "staff.grant"));
  assert.equal(grants.length, 1);
  assert.equal(grants[0]?.actorId, "user-ayse");

  // The invite is single-use, a revoked one grants nothing, and other addresses are untouched.
  await app.deps.db
    .insert(staffInvites)
    .values({ id: "inv-2", email: "gone@akar.test", role: "admin", invitedBy: "admin-1", revokedAt: new Date() });
  assert.equal(await roleOf(await login("user-second-account", "ayse@akar.test")), "user");
  assert.equal(await roleOf(await login("user-gone", "gone@akar.test")), "user");
  assert.equal(await roleOf(await login("user-nobody", "nobody@akar.test")), "user");
  assert.equal(await roleOf(await login("user-no-email")), "user");
  assert.equal((await app.deps.db.select().from(staffMembers)).length, 1);
});

test("only admins reach the staff endpoints: guests get 401, users and other staff roles 403, and nothing changes", async (t) => {
  t.mock.method(globalThis, "fetch", () => {
    throw new Error("unexpected network call");
  });
  await seedStaff("editor-1", "editor@akar.test", "editor");
  await seedStaff("moderator-1", "moderator@akar.test", "moderator");
  await app.deps.db.insert(staffInvites).values({ id: "inv-1", email: "open@akar.test", role: "editor", invitedBy: "admin-1" });

  const endpoints = [
    ["POST", "/v1/admin/staff/invites", { email: "new@akar.test", role: "editor" }],
    ["GET", "/v1/admin/staff", undefined],
    ["GET", "/v1/admin/users", undefined],
    ["PUT", "/v1/admin/users/11111111-1111-4111-8111-111111111111/role", { role: "admin", expectedRole: "user" }],
    ["PUT", "/v1/admin/staff/editor-1", { role: "admin" }],
    ["DELETE", "/v1/admin/staff/moderator-1", undefined],
    ["DELETE", "/v1/admin/staff/invites/inv-1", undefined],
  ] as const;
  for (const [method, url, payload] of endpoints) {
    const guest = await call(method, url, {}, payload);
    assert.equal(guest.statusCode, 401, `guest ${method} ${url}`);
    for (const sub of ["user-plain", "editor-1", "moderator-1"]) {
      const res = await call(method, url, await login(sub), payload);
      assert.equal(res.statusCode, 403, `${sub} ${method} ${url}`);
      assert.equal(res.json<ErrorBody>().error.code, "FORBIDDEN");
    }
  }

  const members = await app.deps.db.select({ userId: staffMembers.userId, role: staffMembers.role }).from(staffMembers);
  assert.deepEqual(members.map((m) => `${m.userId}:${m.role}`).sort(), ["editor-1:editor", "moderator-1:moderator"]);
  const invites = await app.deps.db.select().from(staffInvites);
  assert.deepEqual(invites.map((i) => [i.id, i.revokedAt]), [["inv-1", null]]);
  assert.equal((await app.deps.db.select().from(auditLog)).length, 0);
});

test("the last admin can be neither demoted nor removed, however the request arrives", async (t) => {
  const upstream = mockSupabase(t, () => Response.json({ id: "unused" }));
  await seedStaff("admin-a", "a@akar.test", "admin");
  const a = await login("admin-a");

  const attempts = [
    await call("PUT", "/v1/admin/staff/admin-a", a, { role: "editor" }),
    await call("DELETE", "/v1/admin/staff/admin-a", a),
    await call("POST", "/v1/admin/staff/invites", a, { email: "A@akar.test", role: "editor" }),
  ];
  for (const res of attempts) {
    assert.equal(res.statusCode, 409);
    assert.equal(res.json<ErrorBody>().error.code, "CONFLICT");
  }
  assert.equal(upstream.length, 0);
  assert.equal(await roleOf(a), "admin");
  assert.equal((await app.deps.db.select().from(auditLog)).length, 0);

  // With a second admin the first may step down; then the remaining one is the protected one.
  await seedStaff("admin-b", "b@akar.test", "admin");
  const b = await login("admin-b");
  const stepDown = await call("PUT", "/v1/admin/staff/admin-a", b, { role: "editor" });
  assert.equal(stepDown.statusCode, 200);
  assert.equal(stepDown.json<StaffMemberDto>().role, "editor");
  assert.equal((await call("PUT", "/v1/admin/staff/admin-b", b, { role: "moderator" })).statusCode, 409);
  assert.equal((await call("DELETE", "/v1/admin/staff/admin-b", b)).statusCode, 409);
  assert.equal(await roleOf(b), "admin");

  const audit = await app.deps.db.select().from(auditLog);
  assert.deepEqual(
    audit.map((e) => [e.actorId, e.action, e.entityId]),
    [["admin-b", "staff.role", "admin-a"]],
  );
});

test("two admins demoting each other at the same time leave exactly one admin", async () => {
  await seedStaff("admin-a", "a@akar.test", "admin");
  await seedStaff("admin-b", "b@akar.test", "admin");
  const [a, b] = [await login("admin-a"), await login("admin-b")];

  const results = await Promise.all([
    call("PUT", "/v1/admin/staff/admin-b", a, { role: "editor" }),
    call("PUT", "/v1/admin/staff/admin-a", b, { role: "editor" }),
  ]);

  const statuses = results.map((r) => r.statusCode).sort();
  assert.equal(statuses[0], 200);
  // The loser is refused: 409 when it still was an admin, 403 when the winner had already demoted it.
  assert.ok(statuses[1] === 403 || statuses[1] === 409, `loser got ${statuses[1]}`);
  const admins = await app.deps.db.select().from(staffMembers).where(eq(staffMembers.role, "admin"));
  assert.equal(admins.length, 1);
});

test("an invite is stored and emailed through Supabase; if the account already exists the invite is kept and the first sign-in grants the role", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  // GoTrue's answer when the address already has a confirmed account.
  const upstream = mockSupabase(t, () =>
    Response.json(
      { code: 422, error_code: "email_exists", msg: "A user with this email address has already been registered" },
      { status: 422 },
    ),
  );

  const res = await call("POST", "/v1/admin/staff/invites", admin, { email: "Ayse.Editor@Akar.Test", role: "editor" });
  assert.equal(res.statusCode, 201);
  const body = res.json<InviteResponse>();
  assert.deepEqual(
    { ...body, inviteId: typeof body.inviteId },
    { outcome: "invited", email: "ayse.editor@akar.test", role: "editor", inviteId: "string", userId: null, emailSent: false },
  );
  assert.deepEqual(upstream, [
    {
      url: `${SUPABASE_URL}/auth/v1/invite`,
      method: "POST",
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      body: { email: "ayse.editor@akar.test" },
    },
  ]);

  const [invite] = await app.deps.db.select().from(staffInvites);
  assert.deepEqual(
    { email: invite?.email, role: invite?.role, invitedBy: invite?.invitedBy, userId: invite?.userId, revokedAt: invite?.revokedAt },
    { email: "ayse.editor@akar.test", role: "editor", invitedBy: "admin-1", userId: null, revokedAt: null },
  );
  const [entry] = await app.deps.db.select().from(auditLog);
  assert.deepEqual(
    [entry?.actorId, entry?.action, entry?.entityId, entry?.after],
    ["admin-1", "staff.invite", invite?.id, { email: "ayse.editor@akar.test", role: "editor", emailSent: false }],
  );

  // The existing account signs in as usual and receives the role.
  assert.equal(await roleOf(await login("existing-account", "Ayse.Editor@akar.test")), "editor");
});

test("when Supabase fails the invite is rolled back with 502; a retried Idempotency-Key sends the email once", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  const replies: Array<() => Response> = [
    () => new Response("upstream exploded", { status: 500 }),
    () => {
      throw new TypeError("fetch failed");
    },
    () => Response.json({ id: "user-new", email: "new@akar.test" }),
    () => Response.json({ id: "user-new", email: "new@akar.test" }),
  ];
  const upstream = mockSupabase(t, (n) => replies[n - 1]!());
  const invite = { email: "new@akar.test", role: "editor" };

  // The first two upstream replies fail (HTTP 500, then the network is down): 502 and nothing stored.
  for (const failure of ["Supabase answers 500", "network down"]) {
    const res = await call("POST", "/v1/admin/staff/invites", admin, invite);
    assert.equal(res.statusCode, 502, failure);
    assert.equal(res.json<ErrorBody>().error.code, "UPSTREAM_FAILED", failure);
    assert.equal((await app.deps.db.select().from(staffInvites)).length, 0, failure);
    assert.equal((await app.deps.db.select().from(auditLog)).length, 0, failure);
  }

  const first = await call("POST", "/v1/admin/staff/invites", { ...admin, "idempotency-key": "invite-1" }, invite);
  assert.equal(first.statusCode, 201);
  assert.equal(first.json<InviteResponse>().emailSent, true);
  const retry = await call("POST", "/v1/admin/staff/invites", { ...admin, "idempotency-key": "invite-1" }, invite);
  assert.equal(retry.statusCode, 201);
  assert.deepEqual(retry.json(), first.json());
  assert.equal(upstream.length, 3);

  const reused = await call("POST", "/v1/admin/staff/invites", { ...admin, "idempotency-key": "invite-1" }, { ...invite, role: "admin" });
  assert.equal(reused.statusCode, 422);
  assert.equal(reused.json<ErrorBody>().error.code, "IDEMPOTENCY_KEY_REUSED");

  // Inviting the same address again keeps a single open invite, with the new role, and sends the email again.
  const again = await call("POST", "/v1/admin/staff/invites", admin, { email: "NEW@akar.test", role: "moderator" });
  assert.equal(again.statusCode, 200);
  assert.equal(upstream.length, 4);
  const invites = await app.deps.db.select().from(staffInvites);
  assert.deepEqual(invites.map((i) => [i.email, i.role]), [["new@akar.test", "moderator"]]);
});

test("without a Supabase project identity administration returns 503 and stores nothing", async () => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  const configured = app.deps.config.SUPABASE_SERVICE_ROLE_KEY;
  Object.assign(app.deps.config, { SUPABASE_SERVICE_ROLE_KEY: undefined });
  try {
    const res = await call("POST", "/v1/admin/staff/invites", admin, { email: "new@akar.test", role: "editor" });
    assert.equal(res.statusCode, 503);
    assert.equal(res.json<ErrorBody>().error.code, "SERVICE_UNAVAILABLE");
    assert.equal((await call("GET", "/v1/admin/users", admin)).statusCode, 503);
    assert.equal((await call("PUT", `/v1/admin/users/${memberId}/role`, admin, { role: "admin", expectedRole: "user" })).statusCode, 503);
    assert.equal((await app.deps.db.select().from(staffInvites)).length, 0);
  } finally {
    Object.assign(app.deps.config, { SUPABASE_SERVICE_ROLE_KEY: configured });
  }
});

test("staff lifecycle: an address that already has a role is updated, revoked invites grant nothing, removal returns the account to user", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  await seedStaff("editor-1", "editor@akar.test", "editor");
  const admin = await login("admin-1");
  const upstream = mockSupabase(t, () => Response.json({ id: "user-new" }));

  // An address that already has a role is updated in place; no email goes out.
  const update = await call("POST", "/v1/admin/staff/invites", admin, { email: "EDITOR@akar.test", role: "moderator" });
  assert.equal(update.statusCode, 200);
  assert.deepEqual(update.json(), {
    outcome: "role_updated",
    email: "editor@akar.test",
    role: "moderator",
    inviteId: null,
    userId: "editor-1",
    emailSent: false,
  });
  assert.equal(upstream.length, 0);
  assert.equal(await roleOf(await login("editor-1")), "moderator");

  // A new invite is listed until it is revoked, and a revoked invite grants nothing.
  const { inviteId } = (await call("POST", "/v1/admin/staff/invites", admin, { email: "new@akar.test", role: "editor" })).json<InviteResponse>();
  const listed = (await call("GET", "/v1/admin/staff", admin)).json<{ members: StaffMemberDto[]; invites: StaffInviteDto[] }>();
  assert.deepEqual(listed.members.map((m) => `${m.userId}:${m.role}`).sort(), ["admin-1:admin", "editor-1:moderator"]);
  assert.deepEqual(listed.invites.map((i) => i.id), [inviteId]);

  assert.equal((await call("DELETE", `/v1/admin/staff/invites/${inviteId}`, admin)).statusCode, 200);
  assert.equal((await call("GET", "/v1/admin/staff", admin)).json<{ invites: unknown[] }>().invites.length, 0);
  assert.equal(await roleOf(await login("user-new", "new@akar.test")), "user");
  assert.equal((await call("DELETE", `/v1/admin/staff/invites/${inviteId}`, admin)).statusCode, 404);

  // Removing a member takes the role away immediately; the account stays a plain user.
  assert.equal((await call("DELETE", "/v1/admin/staff/editor-1", admin)).statusCode, 200);
  assert.equal(await roleOf(await login("editor-1")), "user");
  assert.equal((await call("PUT", "/v1/admin/staff/editor-1", admin, { role: "editor" })).statusCode, 404);
  assert.equal((await call("DELETE", "/v1/admin/staff/editor-1", admin)).statusCode, 404);

  const audit = await app.deps.db.select().from(auditLog).orderBy(auditLog.id);
  assert.deepEqual(
    audit.map((e) => `${e.actorId} ${e.action} ${e.entityType}`),
    [
      "admin-1 staff.role staff_member",
      "admin-1 staff.invite staff_invite",
      "admin-1 staff.revoke staff_invite",
      "admin-1 staff.revoke staff_member",
    ],
  );
});

test("the display name is trimmed, replaced on every save and returned by /v1/me; invalid names are 400", async () => {
  assert.equal((await call("GET", "/v1/me")).statusCode, 401);
  assert.equal((await call("PUT", "/v1/me/profile", {}, { displayName: "Ayşe" })).statusCode, 401);

  const headers = await login("user-profile", "Profile@akar.test");
  assert.deepEqual((await call("GET", "/v1/me", headers)).json(), {
    id: "user-profile",
    role: "user",
    email: "Profile@akar.test",
    displayName: null,
    preferences: { siteLang: null, voiceLang: null, voiceGender: null },
  });

  const saved = await call("PUT", "/v1/me/profile", headers, { displayName: "  Ayşe  " });
  assert.equal(saved.statusCode, 200);
  assert.deepEqual(saved.json(), { id: "user-profile", displayName: "Ayşe" });
  await call("PUT", "/v1/me/profile", headers, { displayName: "Ayşe Yılmaz" });
  assert.equal((await call("GET", "/v1/me", headers)).json<{ displayName: string }>().displayName, "Ayşe Yılmaz");
  assert.equal((await app.deps.db.select().from(profiles)).length, 1);

  for (const displayName of ["a", "   ", "x".repeat(41)]) {
    const res = await call("PUT", "/v1/me/profile", headers, { displayName });
    assert.equal(res.statusCode, 400, JSON.stringify(displayName));
    assert.equal(res.json<ErrorBody>().error.code, "VALIDATION_FAILED");
    assert.ok(res.json<ErrorBody>().error.fieldErrors.displayName);
  }
  assert.equal((await call("GET", "/v1/me", headers)).json<{ displayName: string }>().displayName, "Ayşe Yılmaz");
});

test("preferences: partial PUT keeps the other keys, null clears, a name-less account gets a row, invalid values are 400", async () => {
  assert.equal((await call("PUT", "/v1/me/preferences", {}, { siteLang: "en" })).statusCode, 401);

  // No profile row yet: the PUT creates one without a display name.
  const headers = await login("user-prefs", "prefs@akar.test");
  const first = await call("PUT", "/v1/me/preferences", headers, { siteLang: "en" });
  assert.equal(first.statusCode, 200);
  assert.deepEqual(first.json(), { siteLang: "en", voiceLang: null, voiceGender: null });
  assert.match(first.headers["cache-control"] as string, /no-store/);

  const second = await call("PUT", "/v1/me/preferences", headers, { voiceLang: "tr", voiceGender: "male" });
  assert.deepEqual(second.json(), { siteLang: "en", voiceLang: "tr", voiceGender: "male" });
  assert.deepEqual((await call("GET", "/v1/me", headers)).json(), {
    id: "user-prefs",
    role: "user",
    email: "prefs@akar.test",
    displayName: null,
    preferences: { siteLang: "en", voiceLang: "tr", voiceGender: "male" },
  });

  assert.deepEqual((await call("PUT", "/v1/me/preferences", headers, { voiceGender: null })).json(), { siteLang: "en", voiceLang: "tr", voiceGender: null });
  assert.deepEqual((await call("PUT", "/v1/me/preferences", headers, {})).json(), { siteLang: "en", voiceLang: "tr", voiceGender: null });

  // The display name and the preferences share one row and do not overwrite each other.
  await call("PUT", "/v1/me/profile", headers, { displayName: "Ayşe" });
  await call("PUT", "/v1/me/preferences", headers, { siteLang: null });
  const me = (await call("GET", "/v1/me", headers)).json<{ displayName: string; preferences: unknown }>();
  assert.equal(me.displayName, "Ayşe");
  assert.deepEqual(me.preferences, { siteLang: null, voiceLang: "tr", voiceGender: null });
  assert.equal((await app.deps.db.select().from(profiles)).length, 1);

  for (const body of [{ siteLang: "de" }, { voiceLang: "fr" }, { voiceGender: "other" }, { siteLang: 1 }]) {
    const res = await call("PUT", "/v1/me/preferences", headers, body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal(res.json<ErrorBody>().error.code, "VALIDATION_FAILED");
  }
  assert.deepEqual((await call("GET", "/v1/me", headers)).json<{ preferences: unknown }>().preferences, { siteLang: null, voiceLang: "tr", voiceGender: null });
});

test("the bootstrap CLI stores an admin invite that the first sign-in turns into the admin role", async () => {
  const cli = fileURLToPath(new URL("./cli.ts", import.meta.url));
  const run = promisify(execFile);
  const cliWith = (...args: string[]) =>
    run(process.execPath, ["--import", "tsx", cli, ...args], { env: { ...process.env, DATABASE_URL: app.deps.config.DATABASE_URL } });

  await assert.rejects(cliWith("--email", "root@akar.test", "--role", "superuser"), (err: { code?: number }) => err.code === 2);
  assert.equal((await app.deps.db.select().from(staffInvites)).length, 0);

  const { stdout } = await cliWith("--email", "Root@Akar.Test", "--role", "admin");
  assert.match(stdout, /root@akar\.test → admin/);

  const root = await login("user-root", "root@akar.test");
  assert.equal(await roleOf(root), "admin");
  assert.equal((await call("GET", "/v1/admin/staff", root)).statusCode, 200);
});

const memberId = "11111111-1111-4111-8111-111111111111";
const authMember = {
  id: memberId, email: "member@akar.test", created_at: "2026-10-01T12:00:00Z",
  email_confirmed_at: "2026-10-01T12:01:00Z", last_sign_in_at: null,
};

test("member directory pages/searches Auth, joins application roles and names, and exposes no Auth metadata", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  await seedStaff(memberId, authMember.email, "editor");
  await app.deps.db.insert(profiles).values({ userId: memberId, displayName: "Ayşe" });
  const upstream = mockSupabase(t, () => new Response(JSON.stringify({ users: [{ ...authMember, app_metadata: { secret: "hidden" }, phone: "hidden" }] }), {
    headers: { link: '<http://supabase.test/auth/v1/admin/users?page=3>; rel="next"' },
  }));
  const result = await call("GET", "/v1/admin/users?page=2&pageSize=10&query=member%2Btest", await login("admin-1"));
  assert.equal(result.statusCode, 200, result.body);
  assert.match(result.headers["cache-control"] as string, /no-store/);
  assert.deepEqual(result.json(), { items: [{ userId: memberId, email: authMember.email, displayName: "Ayşe", role: "editor", emailConfirmed: true, createdAt: authMember.created_at, lastSignInAt: null }], page: 2, nextPage: 3 });
  const url = new URL(upstream[0]!.url);
  assert.equal(url.searchParams.get("filter"), "member+test");
  assert.equal(url.searchParams.get("per_page"), "10");
  assert.equal(upstream[0]!.authorization, `Bearer ${SERVICE_KEY}`);
  for (const query of ["page=0", "pageSize=101", "page=1.5"]) {
    assert.equal((await call("GET", `/v1/admin/users?${query}`, await login("admin-1"))).statusCode, 400);
  }
  assert.equal(upstream.length, 1);
});

test("ordinary members receive roles immediately; retries are idempotent and removal cannot reclaim an old invite", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  const member = await login(memberId, authMember.email);
  const upstream = mockSupabase(t, () => new Response(JSON.stringify(authMember)));
  await app.deps.db.insert(staffInvites).values({ id: "pending", email: authMember.email, role: "admin", invitedBy: "admin-1" });
  const url = `/v1/admin/users/${memberId}/role`;
  const headers = { ...admin, "idempotency-key": "direct-grant" };
  const body = { role: "admin", expectedRole: "user" };
  const grant = await call("PUT", url, headers, body);
  assert.equal(grant.statusCode, 200, grant.body);
  assert.equal((await call("PUT", url, headers, body)).statusCode, 200);
  assert.equal(upstream.length, 1);
  assert.equal(await roleOf(member), "admin");
  assert.equal((await call("PUT", url, admin, { role: "editor", expectedRole: "user" })).statusCode, 409);
  for (const [from, to] of [["admin", "editor"], ["editor", "moderator"], ["moderator", "user"]]) {
    const changed = await call("PUT", url, admin, { role: to, expectedRole: from });
    assert.equal(changed.statusCode, 200, changed.body);
    assert.equal(await roleOf(member), to);
  }
  assert.equal((await call("GET", "/v1/admin/users", member)).statusCode, 403);
  assert.ok((await app.deps.db.select().from(staffInvites))[0]!.revokedAt);
  const audit = await app.deps.db.select().from(auditLog).where(eq(auditLog.entityId, memberId));
  assert.deepEqual(audit.map((entry) => entry.action).sort(), ["staff.grant", "staff.revoke", "staff.role", "staff.role"]);
  assert.ok(audit.every((entry) => entry.actorId === "admin-1" && entry.requestId));
});

test("member role changes reject self edits, unverified email, deleted/unknown members and invalid roles without writes", async (t) => {
  await seedStaff(memberId, authMember.email, "admin");
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  const url = `/v1/admin/users/${memberId}/role`;
  assert.equal((await call("PUT", url, await login(memberId), { role: "user", expectedRole: "admin" })).statusCode, 409);
  await app.deps.db.delete(staffMembers).where(eq(staffMembers.userId, memberId));
  let response = new Response(JSON.stringify({ ...authMember, email_confirmed_at: null }));
  const upstream = mockSupabase(t, () => response.clone());
  assert.equal((await call("PUT", url, admin, { role: "admin", expectedRole: "user" })).statusCode, 409);
  response = new Response("not found", { status: 404 });
  assert.equal((await call("PUT", url, admin, { role: "admin", expectedRole: "user" })).statusCode, 404);
  assert.equal((await call("PUT", url, admin, { role: "owner", expectedRole: "user" })).statusCode, 400);
  assert.equal((await call("PUT", url, admin, { role: "admin" })).statusCode, 400);
  await app.deps.db.execute(sql`insert into deleted_accounts (user_id) values (${memberId})`);
  assert.equal((await call("PUT", url, admin, { role: "admin", expectedRole: "user" })).statusCode, 404);
  assert.equal(upstream.length, 2);
  assert.equal((await app.deps.db.select().from(auditLog)).length, 0);
});

test("Auth failures and malformed responses return 502 without granting privileges", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  let response = new Response("unavailable", { status: 503 });
  mockSupabase(t, () => response.clone());
  for (const next of [response, new Response("not json"), new Response(JSON.stringify({ users: [{}] }))]) {
    response = next;
    assert.equal((await call("GET", "/v1/admin/users", admin)).statusCode, 502);
    assert.equal((await call("PUT", `/v1/admin/users/${memberId}/role`, admin, { role: "admin", expectedRole: "user" })).statusCode, 502);
  }
  assert.equal((await app.deps.db.select().from(staffMembers)).length, 1);
  assert.equal((await app.deps.db.select().from(auditLog)).length, 0);
});

test("concurrent changes to a member reject stale expectations instead of overwriting", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  mockSupabase(t, () => new Response(JSON.stringify(authMember)));
  const results = await Promise.all(["editor", "admin"].map((role) => call("PUT", `/v1/admin/users/${memberId}/role`, admin, { role, expectedRole: "user" })));
  assert.deepEqual(results.map((result) => result.statusCode).sort(), [200, 409]);
  assert.equal((await app.deps.db.select().from(auditLog).where(eq(auditLog.entityId, memberId))).length, 1);
});

test("role removal revokes invites for both the current Auth email and the former staff email", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  await seedStaff(memberId, "old@akar.test", "editor");
  await app.deps.db.insert(staffInvites).values([
    { id: "old-email", email: "old@akar.test", role: "admin", invitedBy: "admin-1" },
    { id: "new-email", email: authMember.email, role: "admin", invitedBy: "admin-1" },
  ]);
  mockSupabase(t, () => new Response(JSON.stringify(authMember)));
  const result = await call("PUT", `/v1/admin/users/${memberId}/role`, await login("admin-1"), { role: "user", expectedRole: "editor" });
  assert.equal(result.statusCode, 200, result.body);
  assert.equal(await roleOf(await login(memberId, "old@akar.test")), "user");
  assert.equal(await roleOf(await login(memberId, authMember.email)), "user");
  assert.ok((await app.deps.db.select().from(staffInvites)).every((invite) => invite.revokedAt));
});

test("an actor demoted after token verification cannot write through either member or legacy staff endpoints", async (t) => {
  await seedStaff("admin-1", "admin@akar.test", "admin");
  const admin = await login("admin-1");
  const verify = verifier!.verify.bind(verifier);
  t.mock.method(verifier!, "verify", async (jwt: string) => {
    const actor = await verify(jwt);
    if (actor?.id === "admin-1") await app.deps.db.update(staffMembers).set({ role: "editor" }).where(eq(staffMembers.userId, "admin-1"));
    return actor;
  });
  const upstream = mockSupabase(t, () => { throw new Error("must not reach Auth"); });
  for (const [method, url, payload] of [
    ["PUT", `/v1/admin/users/${memberId}/role`, { role: "admin", expectedRole: "user" }],
    ["POST", "/v1/admin/staff/invites", { email: authMember.email, role: "admin" }],
  ] as const) {
    await app.deps.db.update(staffMembers).set({ role: "admin" }).where(eq(staffMembers.userId, "admin-1"));
    const result = await call(method, url, admin, payload);
    assert.equal(result.statusCode, 403, result.body);
  }
  assert.equal(upstream.length, 0);
  assert.equal((await app.deps.db.select().from(auditLog)).length, 0);
});
