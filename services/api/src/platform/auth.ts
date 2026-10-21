import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.ts";

/** `user` = signed-in visitor; staff roles are granted server-side (identity module), never from JWT claims. */
export const roles = ["user", "editor", "moderator", "admin"] as const;
export type Role = (typeof roles)[number];
/** `email` comes from the verified token when present (used for invites and the profile). */
export type AuthUser = { id: string; role: Role; email?: string | undefined };

/** Turns a bearer token into a user; null for an invalid/expired token. Implemented by identity. */
export type AuthVerifier = { verify(token: string): Promise<AuthUser | null> };

declare module "fastify" {
  interface FastifyRequest {
    /** null = guest. Set once per request by the auth hook in app.ts. */
    user: AuthUser | null;
  }
}

/** preHandler: 401 for guests. */
export async function requireUser(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!req.user) throw new AppError(401, "UNAUTHENTICATED", "Bu işlem için giriş yapmalısın.");
}

/** preHandler factory: 401 for guests, 403 unless the user has one of `allowed` (admin always passes). */
export function requireRole(...allowed: Exclude<Role, "user">[]) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new AppError(401, "UNAUTHENTICATED", "Bu işlem için giriş yapmalısın.");
    if (req.user.role !== "admin" && !(allowed as Role[]).includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Bu işlem için yetkin yok.");
    }
  };
}
