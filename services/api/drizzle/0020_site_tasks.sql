CREATE TABLE "site_badges" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"condition" text NOT NULL,
	"task_id" text,
	"on_site_label" boolean DEFAULT false NOT NULL,
	CONSTRAINT "site_badges_order_uq" UNIQUE("site_id","position"),
	CONSTRAINT "site_badges_condition_check" CHECK ("site_badges"."condition" in ('story', 'task')),
	CONSTRAINT "site_badges_task_check" CHECK (("site_badges"."condition" = 'task') = ("site_badges"."task_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "site_badges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_task_answers" (
	"task_id" text PRIMARY KEY NOT NULL,
	"correct_index" integer NOT NULL,
	CONSTRAINT "site_task_answers_index_check" CHECK ("site_task_answers"."correct_index" >= 0)
);
--> statement-breakpoint
ALTER TABLE "site_task_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"media_id" text,
	"part" text,
	"source" text,
	"trust" "trust_level" NOT NULL,
	"details" jsonb NOT NULL,
	CONSTRAINT "site_tasks_order_uq" UNIQUE("site_id","position"),
	CONSTRAINT "site_tasks_kind_check" CHECK ("site_tasks"."kind" in ('quiz', 'field'))
);
--> statement-breakpoint
ALTER TABLE "site_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_site_badges" (
	"user_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"on_site" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_site_badges_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
ALTER TABLE "user_site_badges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_site_tasks" (
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"on_site" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_site_tasks_user_id_task_id_pk" PRIMARY KEY("user_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "user_site_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_badges" ADD CONSTRAINT "site_badges_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_badges" ADD CONSTRAINT "site_badges_task_id_site_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."site_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_task_answers" ADD CONSTRAINT "site_task_answers_task_id_site_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."site_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_tasks" ADD CONSTRAINT "site_tasks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_tasks" ADD CONSTRAINT "site_tasks_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_site_badges" ADD CONSTRAINT "user_site_badges_badge_id_site_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."site_badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_site_tasks" ADD CONSTRAINT "user_site_tasks_task_id_site_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."site_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_badges_task_idx" ON "site_badges" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "site_tasks_media_idx" ON "site_tasks" USING btree ("media_id");