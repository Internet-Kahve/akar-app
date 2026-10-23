import { attachDatabasePool } from "@vercel/functions";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRuntime } from "./runtime.ts";

let runtime: ReturnType<typeof createRuntime> | undefined;
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  runtime ??= createRuntime({ ...process.env, API_RUNTIME: "vercel" }).then((value) => {
    attachDatabasePool(value.pool);
    return value;
  }).catch((error: unknown) => {
    runtime = undefined;
    throw error;
  });
  const { app } = await runtime;
  app.server.emit("request", req, res);
}
