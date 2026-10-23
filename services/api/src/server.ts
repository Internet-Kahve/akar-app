import { createRuntime } from "./runtime.ts";

const { app, pool, config, maintenance } = await createRuntime();
let running: Promise<unknown> | undefined;
const tick = () => {
  if (running) return;
  running = maintenance().catch((err: unknown) => app.log.error({ err }, "maintenance failed"))
    .finally(() => { running = undefined; });
};
const timer = setInterval(tick, 60_000);
timer.unref();
tick();
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    clearInterval(timer);
    await app.close();
    await running;
    await pool.end();
    process.exit(0);
  });
}
await app.listen({ host: config.HOST, port: config.PORT });
