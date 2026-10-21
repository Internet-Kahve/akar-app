import { parseArgs } from "node:util";
import { createDb } from "../db/client.ts";
import { InviteBody } from "../modules/identity/schemas.ts";
import { inviteStaff } from "../modules/identity/service.ts";

// npm run -s local:token -- --email ben@akar.test [--role user|editor|moderator|admin]
// Local development only: signs the address in on the local Supabase without e-mail (admin
// generate_link → one-time code → verify) and prints the access token on stdout. A staff role is
// stored as an invite first; the API grants it on the first request carrying the token.
const USAGE = "Kullanım: npm run -s local:token -- --email <e-posta> [--role user|editor|moderator|admin]";
const { values } = parseArgs({ options: { email: { type: "string" }, role: { type: "string", default: "user" } } });

const fail = (message: string): never => {
  console.error(message);
  process.exit(2);
};

const email = values.email ?? fail(USAGE);
const supabaseUrl = process.env.SUPABASE_URL ?? fail("SUPABASE_URL gerekli (npm run local:up .env'i doldurur).");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || fail("SUPABASE_SERVICE_ROLE_KEY gerekli (npm run local:up .env'i doldurur).");
const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(supabaseUrl.replace(/\/$/, ""));
if (!local) fail(`Bu komut yalnız yerel Supabase içindir; SUPABASE_URL=${supabaseUrl}`);

if (values.role !== "user") {
  const parsed = InviteBody.safeParse({ email, role: values.role });
  if (!parsed.success) fail(USAGE);
  const databaseUrl = process.env.DATABASE_URL ?? fail("DATABASE_URL gerekli.");
  const { db, pool } = createDb(databaseUrl);
  try {
    await db.transaction((tx) => inviteStaff(tx, { ...parsed.data!, actorId: "cli" }));
  } finally {
    await pool.end();
  }
}

const auth = async (path: string, body: unknown): Promise<Record<string, unknown>> => {
  const res = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) fail(`Supabase ${path} ${res.status}: ${JSON.stringify(json)}`);
  return json;
};

const link = await auth("admin/generate_link", { type: "magiclink", email });
const otp = typeof link.email_otp === "string" ? link.email_otp : fail(`Supabase kod döndürmedi: ${JSON.stringify(link)}`);
const session = await auth("verify", { type: "email", email, token: otp });
const token = typeof session.access_token === "string" ? session.access_token : fail("Supabase token döndürmedi.");

console.error(`${email} (${values.role}) için token, 1 saat geçerli. Swagger'da Authorize'a yapıştır ya da: -H "Authorization: Bearer $TOKEN"`);
console.log(token);
