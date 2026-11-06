import { loadConfig } from "../../config.ts";
import { createDb } from "../../db/client.ts";
import { routerFromConfig } from "../../platform/routing.ts";
import { fillWalkingLegs } from "./walking.ts";

// npm run routes:walk
// Computes every missing walking leg of the published routes now instead of waiting for the maintenance
// cron (9 legs a minute). Safe to repeat: cached legs are not asked again. Needs ROUTING_API_KEY.

const config = loadConfig(process.env);
const router = routerFromConfig(config);
if (!router) {
  console.error("ROUTING_API_KEY tanımlı değil.");
  process.exit(1);
}
const { db, pool } = createDb(config.DATABASE_URL, 2, config.DATABASE_SSL_CA);
try {
  const total = { computed: 0, noRoute: 0, failed: 0 };
  for (;;) {
    const run = await fillWalkingLegs({ db, router, dailyLimit: config.ROUTING_DAILY_LIMIT });
    total.computed += run.computed;
    total.noRoute += run.noRoute;
    total.failed += run.failed;
    console.log(`hesaplandı ${run.computed}, yol yok ${run.noRoute}, hata ${run.failed}${run.stopped ? `, durdu: ${run.stopped}` : ""}`);
    if (run.stopped || run.computed + run.noRoute === 0) break;
    // Free plan: 40 requests a minute.
    await new Promise((r) => setTimeout(r, 15_000));
  }
  console.log(`toplam: hesaplandı ${total.computed}, yol yok ${total.noRoute}, hata ${total.failed}`);
} finally {
  await pool.end();
}
