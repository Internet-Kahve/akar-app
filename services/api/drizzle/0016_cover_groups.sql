ALTER TABLE "story_blocks" ADD COLUMN "interior" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "cover_groups" jsonb DEFAULT '[]'::jsonb NOT NULL;