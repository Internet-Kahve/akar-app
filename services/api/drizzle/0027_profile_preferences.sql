ALTER TABLE "profiles" ALTER COLUMN "display_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "site_lang" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "voice_lang" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "voice_gender" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_site_lang_check" CHECK ("profiles"."site_lang" in ('tr', 'en'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_voice_lang_check" CHECK ("profiles"."voice_lang" in ('tr', 'en'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_voice_gender_check" CHECK ("profiles"."voice_gender" in ('female', 'male'));