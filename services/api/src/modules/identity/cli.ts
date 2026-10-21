import { parseArgs } from "node:util";
import { createDb } from "../../db/client.ts";
import { AppError } from "../../errors.ts";
import { InviteBody } from "./schemas.ts";
import { inviteStaff } from "./service.ts";

// npm run staff:invite -- --email ayse@example.com --role admin
// Bootstraps the first admin without HTTP or Supabase: stores an invite; the role is granted on the
// first request that carries a token for that address (i.e. after the next e-mail OTP sign-in).
const USAGE = "Kullanım: npm run staff:invite -- --email <e-posta> --role <editor|moderator|admin>";
const { values } = parseArgs({ options: { email: { type: "string" }, role: { type: "string" } } });

if (!values.email || !values.role) {
  console.error(USAGE);
  process.exit(2);
}
const parsed = InviteBody.safeParse({ email: values.email, role: values.role });
if (!parsed.success) {
  console.error(USAGE);
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  process.exit(2);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL gerekli (services/api/.env).");
  process.exit(2);
}

const { db, pool } = createDb(url);
try {
  const result = await db.transaction((tx) => inviteStaff(tx, { ...parsed.data, actorId: "cli" }));

  if (result.outcome === "role_updated") {
    console.log(`${result.member.email} zaten yetkili; rolü ${result.member.role} olarak ayarlandı.`);
  } else {
    console.log(`${result.created ? "Davet oluşturuldu" : "Açık davet güncellendi"}: ${result.invite.email} → ${result.invite.role}`);
    console.log(
      [
        "",
        "Sıradaki adımlar:",
        "  1. Bu e-posta adresiyle giriş yap; e-postana gelen 6 haneli kodu gir.",
        "  2. API, bu adresle gelen ilk istekte rolü kendiliğinden verir; ayrıca bir işlem gerekmez.",
        "",
        "Not: bu komut Supabase'i çağırmaz, davet e-postası gönderilmedi. Yerel Supabase'te giriş kodu Mailpit'e düşer: http://127.0.0.1:54324",
      ].join("\n"),
    );
  }
} catch (err) {
  if (!(err instanceof AppError)) throw err;
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
