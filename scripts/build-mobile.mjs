import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const envFile = fileURLToPath(
  new URL("../apps/web/.env.mobile.local", import.meta.url),
);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const demo = process.argv.includes("--demo");
const keys = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];
if (demo) {
  for (const key of keys) process.env[key] = "";
} else {
  for (const key of keys) {
    if (!process.env[key]?.trim()) {
      throw new Error(
        `${key} gerekli. apps/web/.env.mobile.local dosyasını .env.mobile.example üzerinden hazırla; örnek veri için mobile:build:demo kullan.`,
      );
    }
  }
  for (const key of keys.slice(0, 2)) {
    const url = new URL(process.env[key]);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error(
        `${key} HTTPS adresi olmalı ve kullanıcı bilgisi içermemeli.`,
      );
    }
  }
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isAnonJwt = (() => {
    try {
      return (
        JSON.parse(Buffer.from(publicKey.split(".")[1], "base64url").toString())
          .role === "anon"
      );
    } catch {
      return false;
    }
  })();
  if (!publicKey.startsWith("sb_publishable_") && !isAnonJwt) {
    throw new Error(
      "Mobil pakette yalnız Supabase publishable/anon anahtarı kullanılabilir.",
    );
  }
}
// Do not accidentally include an editorial content symlink or reuse a stale export.
process.env.NEXT_PUBLIC_DEMO_CONTENT = "";
if (existsSync(new URL("../apps/web/public/icerik", import.meta.url))) {
  throw new Error(
    "public/icerik yerel içerik bağlantısını mobil paketlemeden önce kaldır.",
  );
}
rmSync(new URL("../apps/web/.next-mobile", import.meta.url), {
  recursive: true,
  force: true,
});
const result = spawnSync("npm", ["run", "build", "-w", "@akar/web"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    AKAR_MOBILE_BUILD: "1",
    NEXT_DIST_DIR: ".next-mobile",
  },
});
process.exit(result.status ?? 1);
