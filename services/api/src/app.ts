import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyPluginAsync, type FastifyServerOptions } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { randomUUID } from "node:crypto";
import type { Config } from "./config.ts";
import type { Db } from "./db/client.ts";
import { AppError, registerErrorHandling } from "./errors.ts";
import type { AuthVerifier } from "./platform/auth.ts";
import type { JobQueue } from "./platform/jobs.ts";
import type { StorageBuckets } from "./platform/storage.ts";
import type { Geocoder } from "./modules/ingest/geocode.ts";
import type { CityConfig } from "./modules/ingest/cities.ts";
import { adminImportRoutes } from "./modules/admin-catalog/imports-routes.ts";
import { adminReportRoutes } from "./modules/admin-catalog/reports-routes.ts";
import { adminRouteRoutes } from "./modules/admin-catalog/routes-editor-routes.ts";
import { adminSiteRoutes } from "./modules/admin-catalog/sites-routes.ts";
import { catalogRoutes } from "./modules/catalog/routes.ts";
import { engagementRoutes } from "./modules/engagement/routes.ts";
import { healthRoutes } from "./modules/health/routes.ts";
import { identityRoutes } from "./modules/identity/routes.ts";
import { mediaRoutes } from "./modules/media/routes.ts";
import { moderationRoutes } from "./modules/moderation/routes.ts";
import { catalogRouteRoutes } from "./modules/routes/routes.ts";
import { settingsRoutes } from "./modules/settings/routes.ts";

/**
 * Runtime dependencies. Optional services are null when not configured; a module that needs one
 * answers 503 SERVICE_UNAVAILABLE rather than pretending. `auth` null: every bearer token is 401.
 */
export type AppDeps = {
  config: Config;
  db: Db;
  auth: AuthVerifier | null;
  storage: StorageBuckets | null;
  jobs: JobQueue | null;
  /** Builds the import geocoder for a city and the inventory rows it will locate (network-backed in the server, fake in tests). */
  geocoderFor: ((city: CityConfig, rows: Record<string, string>[]) => Promise<Geocoder>) | null;
};

declare module "fastify" {
  interface FastifyInstance {
    deps: AppDeps;
  }
}

type ModulePlugin = FastifyPluginAsync;

/** Every feature module, registered in this order. */
const MODULES: ModulePlugin[] = [
  healthRoutes,
  catalogRoutes,
  catalogRouteRoutes,
  identityRoutes,
  mediaRoutes,
  adminSiteRoutes,
  adminRouteRoutes,
  adminImportRoutes,
  adminReportRoutes,
  moderationRoutes,
  engagementRoutes,
  settingsRoutes,
];

/**
 * `opts.register`: extra module plugins (tests of a module not yet in MODULES). Plugins already
 * in MODULES are skipped, so tests keep working after a module is added there.
 */
export async function buildApp(deps: AppDeps, opts: { docs?: boolean; register?: ModulePlugin[] } = {}) {
  const logger: FastifyServerOptions["logger"] =
    deps.config.NODE_ENV === "test" ? false : { level: deps.config.LOG_LEVEL };

  const app = Fastify({
    logger,
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
    // Only the configured proxy hops are believed (hop i < TRUST_PROXY); with `true` a client could
    // pick its own `req.ip` through X-Forwarded-For.
    trustProxy: (_addr: string, hop: number) => hop < deps.config.TRUST_PROXY,
    // Signed upload tokens (`/v1/media/uploads/fs/:token`) run ~180 chars; the default cap is 100.
    routerOptions: { maxParamLength: 512 },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate("deps", deps);
  app.addHook("onSend", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  registerErrorHandling(app);
  app.decorateRequest("user", null);
  app.addHook("onRequest", async (req) => {
    const header = req.headers.authorization;
    if (!header) return;
    const token = /^Bearer\s+(\S+)$/i.exec(header)?.[1];
    const user = token && deps.auth ? await deps.auth.verify(token) : null;
    if (!user) throw new AppError(401, "UNAUTHENTICATED", "Oturum geçersiz ya da süresi dolmuş. Yeniden giriş yap.");
    req.user = user;
  });
  await app.register(helmet);
  await app.register(cors, { origin: deps.config.CORS_ORIGINS, credentials: true, methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] });
  // Signed-in callers are limited per account (the auth hook above has set `req.user`), guests per IP.
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute", keyGenerator: (req) => req.user?.id ?? req.ip });

  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "Akar API", version: "0.1.0" },
      servers: [{ url: "/" }],
      // Supabase access token. Optional at the spec level: reads work without it, `requireUser`/`requireRole` enforce it.
      components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
      security: [{}, { bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });
  if (opts.docs !== false) await app.register(swaggerUi, { routePrefix: "/docs" });

  for (const plugin of [...MODULES, ...(opts.register ?? []).filter((p) => !MODULES.includes(p))]) {
    await app.register(plugin);
  }

  await app.ready();
  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
