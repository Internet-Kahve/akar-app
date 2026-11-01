ALTER TABLE "narrations" DROP CONSTRAINT "narrations_subject_type_check";--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD COLUMN "title_en_status" text;--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD COLUMN "body_en" text;--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD COLUMN "body_en_status" text;--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD CONSTRAINT "site_part_cards_title_en_status_check" CHECK ("site_part_cards"."title_en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD CONSTRAINT "site_part_cards_body_en_status_check" CHECK ("site_part_cards"."body_en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "narrations" ADD CONSTRAINT "narrations_subject_type_check" CHECK ("narrations"."subject_type" in ('story_block', 'part_card'));