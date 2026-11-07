ALTER TYPE "public"."publish_status" ADD VALUE 'inactive';--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_deleted_not_published" CHECK ("sites"."deleted_at" IS NULL OR "sites"."status" <> 'published');