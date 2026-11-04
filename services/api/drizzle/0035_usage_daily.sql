CREATE TABLE "usage_daily" (
	"day" date NOT NULL,
	"event" text NOT NULL,
	"site_id" text DEFAULT '' NOT NULL,
	"ref" text DEFAULT '' NOT NULL,
	"guest" boolean NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "usage_daily_day_event_site_id_ref_guest_pk" PRIMARY KEY("day","event","site_id","ref","guest"),
	CONSTRAINT "usage_daily_count_check" CHECK ("usage_daily"."count" > 0)
);
--> statement-breakpoint
ALTER TABLE "usage_daily" ENABLE ROW LEVEL SECURITY;