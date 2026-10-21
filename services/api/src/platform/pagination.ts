import { z } from "zod";
import { AppError } from "../errors.ts";

/** Query params every keyset-paginated list accepts. Response shape: `{ items, nextCursor }`. */
export const PageQuery = z.object({
  cursor: z.string().max(300).optional().describe("Önceki yanıttaki nextCursor"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const pageResponse = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item), nextCursor: z.string().nullable() });

/** Opaque base64url cursor over the last row's sort key, e.g. `{ n: sortName, i: id }`. */
export function encodeCursor(key: Record<string, string>): string {
  return Buffer.from(JSON.stringify(key)).toString("base64url");
}

/** Decodes a cursor that must carry exactly `fields` as strings; anything else is 400 INVALID_CURSOR. */
export function decodeCursor<K extends string>(raw: string, fields: readonly K[]): Record<K, string> {
  try {
    const v: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (v && typeof v === "object" && fields.every((f) => typeof (v as Record<string, unknown>)[f] === "string")) {
      return Object.fromEntries(fields.map((f) => [f, (v as Record<string, string>)[f]])) as Record<K, string>;
    }
  } catch {
    /* falls through */
  }
  throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
}
