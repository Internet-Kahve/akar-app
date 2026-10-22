import { eq } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { mapSettings } from "../../db/schema/index.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { MapSettings } from "./schemas.ts";

const ROW_ID = 1;

async function readRow(db: Db | Tx): Promise<MapSettings> {
  const [row] = await db
    .select({ modelMinZoom: mapSettings.modelMinZoom, maxVisibleModels: mapSettings.maxVisibleModels })
    .from(mapSettings)
    .where(eq(mapSettings.id, ROW_ID));
  // Migration 0005 creates the row; its absence means the database was not migrated.
  if (!row) throw new Error("map_settings row missing; run npm run db:migrate");
  return row;
}

export const getMapSettings = (db: Db): Promise<MapSettings> => readRow(db);

/** Replaces both values and records the change (`map-settings.update`) in the same transaction. */
export async function setMapSettings(
  tx: Tx,
  next: MapSettings,
  actor: { actorId: string; requestId: string },
): Promise<MapSettings> {
  const before = await readRow(tx);
  await tx
    .update(mapSettings)
    .set({ ...next, updatedAt: new Date(), updatedBy: actor.actorId })
    .where(eq(mapSettings.id, ROW_ID));
  await recordAudit(tx, {
    actorId: actor.actorId,
    action: "map-settings.update",
    entityType: "map_settings",
    entityId: String(ROW_ID),
    before,
    after: next,
    requestId: actor.requestId,
  });
  return next;
}
