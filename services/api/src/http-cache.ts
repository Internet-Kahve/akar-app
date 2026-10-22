import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

/**
 * Public read cache: clients may store the body but must revalidate it on every use, so a
 * publish, route edit or moderation decision shows on the next read; an unchanged body costs a 304.
 */
export const CACHE_CONTROL = "public, no-cache";

/**
 * Adds a weak ETag over the serialized body and 304 on If-None-Match to every 200 GET in
 * `app`'s encapsulation scope. Call inside a route plugin so only read endpoints are cached.
 */
export function addReadCache(app: FastifyInstance): void {
  app.addHook("onSend", async (req, reply, payload) => {
    if (req.method !== "GET" || reply.statusCode !== 200 || typeof payload !== "string") return payload;

    const etag = `W/"${createHash("sha1").update(payload).digest("base64url")}"`;
    reply.header("etag", etag);
    reply.header("cache-control", CACHE_CONTROL);

    const tags = req.headers["if-none-match"]?.split(",").map((t) => t.trim().replace(/^W\//, ""));
    if (tags?.includes("*") || tags?.includes(etag.slice(2))) {
      reply.code(304).removeHeader("content-length").removeHeader("content-type");
      return "";
    }
    return payload;
  });
}
