import { z } from "zod";
import { staffRoles } from "../../db/schema/index.ts";
import { roles } from "../../platform/auth.ts";

/** Roles an admin can grant. A plain `user` is the absence of a staff row. */
export const StaffRoleSchema = z
  .enum(staffRoles, "Rol editor, moderator ya da admin olmalı.")
  .describe("Yetkili rolü: editor, moderator ya da admin");

const Email = z.email("Geçerli bir e-posta adresi gir.").max(254, "E-posta adresi en fazla 254 karakter olmalı.");

export const UserIdParams = z.object({ userId: z.string().min(1).max(200) });
export const InviteIdParams = z.object({ id: z.string().min(1).max(100) });

export const MeResponse = z.object({
  id: z.string().describe("Kullanıcı kimliği (Supabase JWT sub)"),
  role: z.enum(roles).describe("Sunucuda atanmış rol; yetkili kaydı olmayan oturum user olur"),
  email: z.string().nullable().describe("Girişte kullanılan e-posta (token'dan)"),
  displayName: z.string().nullable().describe("Onaylı anılarda görünen ad; henüz belirlenmediyse null"),
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
