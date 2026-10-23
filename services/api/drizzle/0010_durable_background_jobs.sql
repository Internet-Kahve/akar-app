CREATE TABLE "background_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_token" text,
	"lease_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "background_jobs_due_idx" ON "background_jobs" USING btree ("available_at");
--> statement-breakpoint
ALTER TABLE "background_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO background_jobs (id, name, data)
SELECT 'resume-model-' || id, 'media.glb-parts', jsonb_build_object('mediaId', id)
FROM media WHERE parts_status = 'pending';
--> statement-breakpoint
INSERT INTO background_jobs (id, name, data)
SELECT 'resume-import-' || id, 'admin.import-plan', jsonb_build_object('importId', id)
FROM import_jobs WHERE status IN ('queued', 'planning');
