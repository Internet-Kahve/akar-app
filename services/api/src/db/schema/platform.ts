import { bigserial, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/** Request-independent work. A lease survives instance shutdown and expires for a later cron run. */
export const backgroundJobs = pgTable("background_jobs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  data: jsonb("data").notNull(),
  attempts: integer("attempts").notNull().default(0),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
  leaseToken: text("lease_token"),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("background_jobs_due_idx").on(t.availableAt)]).enableRLS();

/** Replay store for mutations carrying an Idempotency-Key (scoped per actor). */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    actorId: text("actor_id").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    statusCode: integer("status_code").notNull(),
    responseBody: jsonb("response_body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.actorId, t.key] }), index("idempotency_keys_created_at_idx").on(t.createdAt)],
);

/** Append-only record of privileged changes (content edits, moderation decisions, role changes). */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    requestId: text("request_id"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_entity_idx").on(t.entityType, t.entityId), index("audit_log_at_idx").on(t.at)],
);
