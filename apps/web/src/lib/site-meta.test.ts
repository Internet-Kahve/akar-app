import assert from "node:assert/strict";
import test from "node:test";
import type { HeritageSite } from "@akar/domain";
import { byDisplayOrder } from "./site-meta";

test("byDisplayOrder puts ranked sites first and leaves the input alone", () => {
  const site = (name: string, displayOrder?: number) =>
    ({ name, ...(displayOrder && { displayOrder }) }) as HeritageSite;
  const sites = [site("Çeşme"), site("Bedesten", 2), site("Alaaddin"), site("Ulucami", 1)];
  assert.deepEqual(byDisplayOrder(sites).map((s) => s.name), [
    "Ulucami",
    "Bedesten",
    "Alaaddin",
    "Çeşme",
  ]);
  assert.equal(sites[0]!.name, "Çeşme");
});
