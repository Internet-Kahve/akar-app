import test from "node:test";
import assert from "node:assert/strict";
import { createMockClient, type StorageAdapter } from "./index";
function storage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
  };
}
test("progress survives a new client and reset clears progress", async () => {
  const s = storage(),
    a = createMockClient(s);
  await a.dispatch({ type: "visit", siteId: "kilic-ali-pasa" });
  const b = createMockClient(s);
  assert.equal((await b.getSnapshot()).points, 100);
  await b.reset();
  assert.equal((await createMockClient(s).getSnapshot()).points, 0);
});
test("invalid saved state recovers without crashing", async () => {
  const s = storage();
  s.setItem("akar-demo-v1", "{broken");
  assert.equal((await createMockClient(s).getSnapshot()).sites.length, 6);
  s.setItem("akar-demo-v1", JSON.stringify({ version: 1, sites: [] }));
  assert.equal((await createMockClient(s).getSnapshot()).sites.length, 6);
});
test("storage failure is reported and does not pretend a mutation succeeded", async () => {
  const c = createMockClient({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
  });
  await assert.rejects(
    c.dispatch({ type: "visit", siteId: "kilic-ali-pasa" }),
    /depolaması/,
  );
  assert.equal((await c.getSnapshot()).points, 0);
});
