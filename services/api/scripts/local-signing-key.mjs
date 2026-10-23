import { generateKeyPairSync, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const key = { ...privateKey.export({ format: "jwk" }), kid: randomUUID(), alg: "ES256", use: "sig", key_ops: ["sign", "verify"], ext: true };
try {
  writeFileSync(new URL("../supabase/signing_keys.json", import.meta.url), JSON.stringify([key]), { mode: 0o600, flag: "wx" });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
