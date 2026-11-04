// Prints the licences of the app's direct dependencies, from package-lock.json, for docs/LISANSLAR.md:
//   node scripts/lisans-tablosu.mjs
import { readFileSync } from "node:fs";
const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const lock = read("package-lock.json").packages;
const names = new Set();
for (const p of ["package.json", "apps/web/package.json", "services/api/package.json", "packages/domain/package.json", "packages/api-client/package.json"])
  for (const name of Object.keys(read(p).dependencies ?? {})) if (!name.startsWith("@akar/")) names.add(name);
console.log("| Paket | Sürüm | Lisans |\n|---|---|---|");
for (const name of [...names].sort()) {
  const entry = lock[`node_modules/${name}`];
  console.log(`| ${name} | ${entry?.version ?? "?"} | ${entry?.license ?? "?"} |`);
}
