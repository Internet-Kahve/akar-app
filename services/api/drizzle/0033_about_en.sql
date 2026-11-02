ALTER TABLE "history_images" ADD COLUMN "en_status" text;--> statement-breakpoint
ALTER TABLE "site_about_chapters" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "site_about_chapters" ADD COLUMN "reading_en" jsonb;--> statement-breakpoint
ALTER TABLE "site_about_chapters" ADD COLUMN "en_status" text;--> statement-breakpoint
ALTER TABLE "site_badges" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "site_badges" ADD COLUMN "text_en" text;--> statement-breakpoint
ALTER TABLE "site_badges" ADD COLUMN "en_status" text;--> statement-breakpoint
ALTER TABLE "site_sections" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "site_sections" ADD COLUMN "en_status" text;--> statement-breakpoint
ALTER TABLE "site_tasks" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "site_tasks" ADD COLUMN "prompt_en" text;--> statement-breakpoint
ALTER TABLE "site_tasks" ADD COLUMN "details_en" jsonb;--> statement-breakpoint
ALTER TABLE "site_tasks" ADD COLUMN "en_status" text;--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_en_status_check" CHECK ("history_images"."en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "site_about_chapters" ADD CONSTRAINT "site_about_chapters_en_status_check" CHECK ("site_about_chapters"."en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "site_badges" ADD CONSTRAINT "site_badges_en_status_check" CHECK ("site_badges"."en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "site_sections" ADD CONSTRAINT "site_sections_en_status_check" CHECK ("site_sections"."en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "site_tasks" ADD CONSTRAINT "site_tasks_en_status_check" CHECK ("site_tasks"."en_status" in ('machine', 'reviewed'));