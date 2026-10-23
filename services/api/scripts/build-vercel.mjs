import { build } from "esbuild";
import { readFile } from "node:fs/promises";

const { dependencies } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
await build({
  absWorkingDir: new URL("..", import.meta.url).pathname,
  entryPoints: ["src/vercel.ts"],
  outfile: "dist/vercel.mjs",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  // Bundle workspace TypeScript; keep npm packages intact for their runtime assets.
  external: Object.keys(dependencies).filter((name) => !name.startsWith("@akar/")),
});
