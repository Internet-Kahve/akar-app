import assert from "node:assert/strict";
import test from "node:test";
import { AVATARS, avatarById, randomAvatar, resolveAvatar } from "./avatars";

test("six figures with unique ids, each with a colour", () => {
  assert.equal(AVATARS.length, 6);
  assert.equal(new Set(AVATARS.map((a) => a.id)).size, 6);
  for (const a of AVATARS) assert.match(a.colour, /^#[0-9a-f]{6}$/i);
});

test("a kept figure stays; an unknown or missing one is replaced by a chance figure that is always valid", () => {
  assert.equal(resolveAvatar("mimar-sinan", () => 0).id, "mimar-sinan");
  assert.equal(resolveAvatar("gone", () => 0).id, AVATARS[0]!.id);
  assert.equal(resolveAvatar(null, () => 0.999999).id, AVATARS[5]!.id);
  assert.equal(randomAvatar(() => 1).id, AVATARS[5]!.id);
  assert.equal(avatarById("nobody"), undefined);
});
