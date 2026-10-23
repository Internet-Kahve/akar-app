import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The editorial _sunum GLBs use Draco compression. Ship the decoder with the locked Three.js version.
const source = join(dirname(fileURLToPath(import.meta.resolve("three"))), "../examples/jsm/libs/draco/gltf");
const target = fileURLToPath(new URL("../public/draco/", import.meta.url));
await mkdir(target, { recursive: true });
for (const file of ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"]) await copyFile(join(source, file), join(target, file));
