CREATE TABLE "site_sample_traces" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"position" integer NOT NULL,
	"author" text NOT NULL,
	"text" text NOT NULL,
	"media_id" text NOT NULL,
	"history_image_id" text,
	"angle_match" text,
	"added_on" date NOT NULL,
	CONSTRAINT "site_sample_traces_order_uq" UNIQUE("site_id","position"),
	CONSTRAINT "site_sample_traces_angle_check" CHECK ("site_sample_traces"."angle_match" in ('same', 'near'))
);
--> statement-breakpoint
ALTER TABLE "site_sample_traces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "history_images" ADD COLUMN "present_angle_match" text;--> statement-breakpoint
ALTER TABLE "site_sample_traces" ADD CONSTRAINT "site_sample_traces_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_sample_traces" ADD CONSTRAINT "site_sample_traces_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_sample_traces" ADD CONSTRAINT "site_sample_traces_history_image_id_history_images_id_fk" FOREIGN KEY ("history_image_id") REFERENCES "public"."history_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_sample_traces_media_idx" ON "site_sample_traces" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "site_sample_traces_history_idx" ON "site_sample_traces" USING btree ("history_image_id");--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_present_angle_check" CHECK ("history_images"."present_angle_match" in ('same', 'near'));--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_present_match_needs_photo" CHECK ("history_images"."present_angle_match" is null or "history_images"."present_media_id" is not null);