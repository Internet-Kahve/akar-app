import { check, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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

/**
 * One row per account that stored something about itself: the public display name shown on approved memories and
 * the site/voice preferences. Either side may be missing, so a row can exist without a name.
 */
export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name"),
    /** Site language: `tr` or `en`; null until chosen. */
    siteLang: text("site_lang"),
    /** Narration language: `tr` or `en`; null until chosen. */
    voiceLang: text("voice_lang"),
    /** Narration voice: `female` or `male`; null until chosen. */
    voiceGender: text("voice_gender"),
    ...timestamps,
  },
  (t) => [
    check("profiles_site_lang_check", sql`${t.siteLang} in ('tr', 'en')`),
    check("profiles_voice_lang_check", sql`${t.voiceLang} in ('tr', 'en')`),
    check("profiles_voice_gender_check", sql`${t.voiceGender} in ('female', 'male')`),
  ],
);

/**
 * Erased accounts (KVKK, `DELETE /v1/me`): only the id and when. An access token stays valid until it expires
 * after Supabase deletes the user; the verifier answers 401 for these ids, so nothing new is written under them.
 */
export const deletedAccounts = pgTable("deleted_accounts", {
  userId: text("user_id").primaryKey(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
