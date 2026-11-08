import { test } from "node:test";
import assert from "node:assert/strict";
import { fitPadding } from "./fit-padding";

test("fit padding stays as asked where the canvas has room", () => {
  const p = { top: 110, right: 150, bottom: 110, left: 70 };
  assert.deepEqual(fitPadding(p, 1200, 800), p);
});

test("a phone's tall sheet is squeezed so the route still has room on the canvas", () => {
  const p = fitPadding({ top: 110, right: 150, bottom: 110 + 520, left: 70 }, 390, 700);
  assert.ok(p.top + p.bottom <= 700 - 120);
  assert.ok(p.bottom > p.top, "the sheet's side keeps the larger share");
  assert.ok(p.left + p.right <= 390 - 120);
});
