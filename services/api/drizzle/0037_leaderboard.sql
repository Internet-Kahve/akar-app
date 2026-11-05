ALTER TABLE "profiles" ADD COLUMN "avatar_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "leaderboard_visible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "point_events_at_idx" ON "point_events" USING btree ("at");