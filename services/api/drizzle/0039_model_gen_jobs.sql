CREATE TABLE "model_gen_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" text NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"runner_job_id" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"reply" text,
	"error" text,
	"version" text,
	"files" jsonb,
	"warnings" jsonb,
	"usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "model_gen_jobs_status_check" CHECK ("model_gen_jobs"."status" in ('running', 'succeeded', 'failed', 'lost'))
);
--> statement-breakpoint
ALTER TABLE "model_gen_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "model_gen_jobs" ADD CONSTRAINT "model_gen_jobs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_gen_jobs_site_created_idx" ON "model_gen_jobs" USING btree ("site_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);