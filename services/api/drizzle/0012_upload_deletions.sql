CREATE TABLE "upload_deletions" (
	"storage_key" text PRIMARY KEY NOT NULL,
	"next_attempt_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "upload_deletions_due_idx" ON "upload_deletions" USING btree ("next_attempt_at");