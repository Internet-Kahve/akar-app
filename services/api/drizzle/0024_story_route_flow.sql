ALTER TABLE "story_blocks" ADD COLUMN "route_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD COLUMN "flow" jsonb;