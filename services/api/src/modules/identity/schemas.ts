import { z } from "zod";
import { staffRoles } from "../../db/schema/index.ts";
import { roles } from "../../platform/auth.ts";

/** Roles an admin can grant. A plain `user` is the absence of a staff row. */
export const StaffRoleSchema = z
  .enum(staffRoles, "Rol editor, moderator ya da admin olmalı.")
  .describe("Yetkili rolü: editor, moderator ya da admin");

const Email = z.email("Geçerli bir e-posta adresi gir.").max(254, "E-posta adresi en fazla 254 karakter olmalı.");

export const UserIdParams = z.object({ userId: z.string().min(1).max(200) });
/** Supabase Auth user ids are UUIDs; a typo must not mark a random id as erased. */
export const AccountIdParams = z.object({ userId: z.uuid() });
export const InviteIdParams = z.object({ id: z.string().min(1).max(100) });

export const PreferencesDto = z.object({
  siteLang: z.enum(["tr", "en"]).nullable().describe("Site dili; henüz seçilmediyse null"),
  voiceLang: z.enum(["tr", "en"]).nullable().describe("Sesli anlatım dili; henüz seçilmediyse null"),
  voiceGender: z.enum(["female", "male"]).nullable().describe("Sesli anlatım sesi; henüz seçilmediyse null"),
});

export const MeResponse = z.object({
  id: z.string().describe("Kullanıcı kimliği (Supabase JWT sub)"),
  role: z.enum(roles).describe("Sunucuda atanmış rol; yetkili kaydı olmayan oturum user olur"),
  email: z.string().nullable().describe("Girişte kullanılan e-posta (token'dan)"),
  displayName: z.string().nullable().describe("Onaylı anılarda görünen ad; henüz belirlenmediyse null"),
  preferences: PreferencesDto.describe("Site ve ses tercihleri; seçilmeyenler null"),
});

/** Any subset of the keys: a value sets it, null clears it, a missing key stays as it was. */
export const PreferencesBody = z.object({
  siteLang: z.enum(["tr", "en"], "Site dili tr ya da en olmalı.").nullable().optional(),
  voiceLang: z.enum(["tr", "en"], "Ses dili tr ya da en olmalı.").nullable().optional(),
  voiceGender: z.enum(["female", "male"], "Ses female ya da male olmalı.").nullable().optional(),
});

export const ProfileBody = z.object({
  displayName: z
    .string("Görünen ad metin olmalı.")
    .trim()
    .min(2, "Görünen ad en az 2 karakter olmalı.")
    .max(40, "Görünen ad en fazla 40 karakter olmalı."),
});

export const ProfileResponse = z.object({
  id: z.string(),
  displayName: z.string(),
});

export const InviteBody = z.object({ email: Email, role: StaffRoleSchema });
export const RoleBody = z.object({ role: StaffRoleSchema });

export const StaffMemberDto = z.object({
  userId: z.string(),
  email: z.string(),
  role: StaffRoleSchema,
  grantedBy: z.string().describe("Rolü veren yöneticinin kimliği; davetle verildiyse daveti gönderen"),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type StaffMemberDto = z.infer<typeof StaffMemberDto>;

export const StaffInviteDto = z.object({
  id: z.string(),
  email: z.string(),
  role: StaffRoleSchema,
  invitedBy: z.string(),
  createdAt: z.iso.datetime(),
});
export type StaffInviteDto = z.infer<typeof StaffInviteDto>;

export const StaffListResponse = z.object({
  members: z.array(StaffMemberDto),
  invites: z.array(StaffInviteDto).describe("Henüz kullanılmamış ve geri alınmamış davetler"),
});

export const InviteResponse = z.object({
  outcome: z
    .enum(["invited", "role_updated"])
    .describe("invited: davet bekliyor, rol ilk girişte verilir · role_updated: e-posta zaten yetkili, rolü güncellendi"),
  email: z.string(),
  role: StaffRoleSchema,
  inviteId: z.string().nullable().describe("outcome=invited ise davet kimliği"),
  userId: z.string().nullable().describe("outcome=role_updated ise yetkilinin kullanıcı kimliği"),
  emailSent: z
    .boolean()
    .describe("Davet e-postası gönderildi. Hesap zaten varsa false: rol, e-postayla yapılan ilk girişte verilir"),
});
export type InviteResponse = z.infer<typeof InviteResponse>;

export const MemberListQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  query: z.string().trim().max(254).default(""),
});
export type MemberListQuery = z.infer<typeof MemberListQuery>;
export const MemberDto = z.object({
  userId: z.string(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  role: z.enum(roles),
  emailConfirmed: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  lastSignInAt: z.iso.datetime({ offset: true }).nullable(),
});
export type MemberDto = z.infer<typeof MemberDto>;
export const MemberListResponse = z.object({
  items: z.array(MemberDto), page: z.number(), nextPage: z.number().nullable(),
});
export const MemberRoleBody = z.object({
  role: z.enum(roles), expectedRole: z.enum(roles).describe("Ekranda görünen rol; eşzamanlı değişiklikte 409"),
});
