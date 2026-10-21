import type { AuthUser, AuthVerifier } from "../platform/auth.ts";
import { roles } from "../platform/auth.ts";

// Test-only verifier: module tests authenticate without Supabase. The identity module's own
// tests exercise the real JWT verifier by passing it to `startTestApp({ auth })`.

const PREFIX = "test.";

export const testVerifier: AuthVerifier = {
  async verify(token) {
    if (!token.startsWith(PREFIX)) return null;
    try {
      const u = JSON.parse(Buffer.from(token.slice(PREFIX.length), "base64url").toString("utf8")) as Partial<AuthUser>;
      if (typeof u.id !== "string" || !roles.includes(u.role as AuthUser["role"])) return null;
      return { id: u.id, role: u.role!, email: typeof u.email === "string" ? u.email : undefined };
    } catch {
      return null;
    }
  },
};

/** `Authorization` header for `app.inject` as the given user. */
export function authHeader(user: AuthUser): { authorization: string } {
  return { authorization: `Bearer ${PREFIX}${Buffer.from(JSON.stringify(user)).toString("base64url")}` };
}
