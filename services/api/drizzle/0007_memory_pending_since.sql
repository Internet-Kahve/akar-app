ALTER TABLE "memories" ADD COLUMN "pending_since" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
-- Existing rows: a pending memory was last written when it entered the queue (submission or the report that
-- sent it back), so `updated_at` is that moment; decided ones keep their submission time.
UPDATE "memories" SET "pending_since" = CASE WHEN "status" = 'pending' THEN "updated_at" ELSE "created_at" END;
