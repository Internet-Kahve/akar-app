import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { Db } from "../../db/client.ts";
import type { AuthVerifier } from "../../platform/auth.ts";
import { resolveRole } from "./service.ts";

/** Supabase signs access tokens with ES256 (RS256 on older projects). Symmetric algorithms and `none` are never accepted. */
const ALGORITHMS = ["ES256", "RS256"];

export type JwksVerifierOptions = {
  /** JWKS endpoint (fetched and cached by jose), or a ready key resolver such as `createLocalJWKSet(...)` in tests. */
  jwks: string | URL | JWTVerifyGetKey;
  /** Exact `iss` of the access tokens, e.g. `https://<project>.supabase.co/auth/v1`. */
  issuer: string;
  /** Expected `aud`; Supabase uses `authenticated`. */
  audience: string;
  db: Db;
};

/**
 * The signing keys could not be obtained (network, Supabase down, malformed key set). That is our
 * outage, not an invalid session: it surfaces as a server error so clients keep their session.
 */
class SigningKeysUnavailableError extends Error {
  constructor(cause: unknown) {
    super("token signing keys unavailable", { cause });
    this.name = "SigningKeysUnavailableError";
  }
}

/**
 * Verifies Supabase access tokens: signature against the JWKS, `iss`, `aud`, `exp`, and a `sub`.
 * `AuthUser.id` is `sub` and `email` is the token's email claim. The role is never read from the
 * token: it comes from `staff_members` (no row = `user`), and the address of an open staff invite
 * is turned into that membership on the invitee's first request. An invalid or expired token is
 * `null` (the app answers 401).
 */
export function createJwksVerifier({ jwks, issuer, audience, db }: JwksVerifierOptions): AuthVerifier {
  const keys: JWTVerifyGetKey = typeof jwks === "function" ? jwks : createRemoteJWKSet(new URL(jwks));

  const getKey: JWTVerifyGetKey = async (header, token) => {
    try {
      return await keys(header, token);
    } catch (err) {
      // The token named a key we do not have: a bad token. Anything else is a failure to get our keys.
      if (err instanceof errors.JWKSNoMatchingKey || err instanceof errors.JWKSMultipleMatchingKeys) throw err;
      throw new SigningKeysUnavailableError(err);
    }
  };

  return {
    async verify(token) {
      let payload: JWTPayload;
      try {
        ({ payload } = await jwtVerify(token, getKey, { issuer, audience, algorithms: ALGORITHMS, requiredClaims: ["sub", "exp"] }));
      } catch (err) {
        if (err instanceof SigningKeysUnavailableError) throw err;
        return null;
      }

      const sub = payload.sub;
      if (typeof sub !== "string" || sub === "") return null;
      const claim = typeof payload.email === "string" ? payload.email.trim() : "";
      const email = claim === "" ? undefined : claim;

      return { id: sub, role: await resolveRole(db, sub, email), email };
    },
  };
}
