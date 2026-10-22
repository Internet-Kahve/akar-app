import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./shared.ts";

// Owned by the identity module. User ids are Supabase Auth `sub` (uuid as text); the auth users
// themselves live in Supabase, never in this database.

export const staffRoles = ["editor", "moderator", "admin"] as const;
export const staffRoleEnum = pgEnum("staff_role", staffRoles);

/** Server-side role grants. A signed-in user without a row is a plain `user`. */
export const staffMembers = pgTable("staff_members", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  role: staffRoleEnum("role").notNull(),
  grantedBy: text("granted_by").notNull(),
  ...timestamps,
});

/** Admin invitations ("davet"); the invited account gets its role when the invite is created. */
export const staffInvites = pgTable(
  "staff_invites",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: staffRoleEnum("role").notNull(),
    invitedBy: text("invited_by").notNull(),
    /** Supabase user id returned by the invite call. */
    userId: text("user_id"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("staff_invites_email_idx").on(t.email)],
);

/** Public display name shown on approved memories; nothing else personal is stored here. */
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  ...timestamps,
});
