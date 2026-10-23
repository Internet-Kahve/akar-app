import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// MapLibre 6 ships an ESM worker importing its shared sibling. Serve both from the same origin:
// bundlers must not rewrite the worker's relative module import into a missing chunk.
const source = dirname(fileURLToPath(import.meta.resolve("maplibre-gl")));
const target = fileURLToPath(new URL("../public/maplibre/", import.meta.url));
await mkdir(target, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(join(source, file), join(target, file));
}
