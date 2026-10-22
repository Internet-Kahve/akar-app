CREATE TYPE "public"."media_parts_status" AS ENUM('none', 'pending', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."media_upload_status" AS ENUM('pending', 'completed', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('editor', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('queued', 'planning', 'planned', 'committing', 'committed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "media_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"kind" "media_kind" NOT NULL,
	"content_type" text NOT NULL,
	"max_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"status" "media_upload_status" DEFAULT 'pending' NOT NULL,
	"reject_reason" text,
	"media_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_uploads_storage_key_uq" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"invited_by" text NOT NULL,
	"user_id" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"granted_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"status" "import_status" DEFAULT 'queued' NOT NULL,
	"csv" text NOT NULL,
	"include_toc" boolean DEFAULT false NOT NULL,
	"report" jsonb,
	"plan" jsonb,
	"inserted_count" integer,
	"error" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"text" text NOT NULL,
	"media_id" text,
	"status" "memory_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"kvkk_consent_at" timestamp with time zone NOT NULL,
	"kvkk_text_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memories_text_length" CHECK (char_length("memories"."text") BETWEEN 1 AND 280),
	CONSTRAINT "memories_reject_reason" CHECK ("memories"."status" <> 'rejected' OR coalesce(btrim("memories"."reason"), '') <> '')
);
--> statement-breakpoint
CREATE TABLE "memory_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"memory_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_reports_once_uq" UNIQUE("memory_id","reporter_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_progress" (
	"player_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"wrong_attempts" smallint DEFAULT 0 NOT NULL,
	"revealed" boolean DEFAULT false NOT NULL,
	"solved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_progress_player_id_quiz_id_pk" PRIMARY KEY("player_id","quiz_id")
);
--> statement-breakpoint
CREATE TABLE "saved_sites" (
	"user_id" text NOT NULL,
	"site_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_sites_user_id_site_id_pk" PRIMARY KEY("user_id","site_id")
);
--> statement-breakpoint
CREATE TABLE "story_progress" (
	"user_id" text NOT NULL,
	"site_id" text NOT NULL,
	"last_block" integer NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_progress_user_id_site_id_pk" PRIMARY KEY("user_id","site_id")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"user_id" text NOT NULL,
	"route_id" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_user_id_route_id_pk" PRIMARY KEY("user_id","route_id")
);
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "parts_status" "media_parts_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "storage_key" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "uploaded_by" text;--> statement-breakpoint
ALTER TABLE "media_uploads" ADD CONSTRAINT "media_uploads_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_reports" ADD CONSTRAINT "memory_reports_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_progress" ADD CONSTRAINT "quiz_progress_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_sites" ADD CONSTRAINT "saved_sites_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_route_id_catalog_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."catalog_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_uploads_owner_idx" ON "media_uploads" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "staff_invites_email_idx" ON "staff_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "import_jobs_created_idx" ON "import_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memories_site_status_idx" ON "memories" USING btree ("site_id","status");--> statement-breakpoint
CREATE INDEX "memories_status_created_idx" ON "memories" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "memories_author_idx" ON "memories" USING btree ("author_id");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_storage_key_uq" UNIQUE("storage_key");