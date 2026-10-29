import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/prepare-demo-content.py", import.meta.url));

test("content preparation refuses draft task files without replacing an existing manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "akar-task-drafts-"));
  try {
    const tasks = join(root, "eserler/koza-han/icerik");
    await mkdir(tasks, { recursive: true });
    const reader = join(root, "design/test-redmi9t-v2");
    await mkdir(reader, { recursive: true });
    await writeFile(join(reader, "hazirla.py"), "def eserleri_bul():\n    return []\n");
    const output = join(root, "manifest.json");
    await writeFile(output, "previous reviewed manifest");
    for (const flag of [true, "true", "false", null, 0]) {
      await writeFile(join(tasks, "gorevler.json"), JSON.stringify({ _taslak: flag, gorevler: [], rozetler: [] }));
      const run = spawnSync("python3", [script, "--content", root, "--output", output], { encoding: "utf8" });
      assert.notEqual(run.status, 0);
      assert.match(run.stderr, /Unreviewed task file:.*koza-han/);
      assert.equal(await readFile(output, "utf8"), "previous reviewed manifest");
    }
    // Minimal approved package: no source archive is required in CI.
    for (const data of [{ gorevler: [], rozetler: [] }, { _taslak: false, gorevler: [], rozetler: [] }]) {
      await writeFile(join(tasks, "gorevler.json"), JSON.stringify(data));
      const run = spawnSync("python3", [script, "--content", root, "--output", output], { encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr);
      assert.equal(JSON.parse(await readFile(output, "utf8")).version, 1);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
