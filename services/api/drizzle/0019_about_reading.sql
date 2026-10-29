CREATE TABLE "site_about_chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"kind" "section_kind" NOT NULL,
	"reading" jsonb NOT NULL,
	CONSTRAINT "site_about_chapters_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
ALTER TABLE "site_about_chapters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_section_photos" (
	"site_id" text NOT NULL,
	"section_id" text NOT NULL,
	"position" integer NOT NULL,
	"media_id" text NOT NULL,
	"aspect" numeric(6, 3),
	"alt" text NOT NULL,
	CONSTRAINT "site_section_photos_site_id_section_id_position_pk" PRIMARY KEY("site_id","section_id","position")
);
--> statement-breakpoint
ALTER TABLE "site_section_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_sections" ADD COLUMN "chapter_id" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "about_cover_media_id" text;--> statement-breakpoint
ALTER TABLE "site_about_chapters" ADD CONSTRAINT "site_about_chapters_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_section_photos" ADD CONSTRAINT "site_section_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_section_photos" ADD CONSTRAINT "site_section_photos_section_fk" FOREIGN KEY ("site_id","section_id") REFERENCES "public"."site_sections"("site_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_section_photos_media_idx" ON "site_section_photos" USING btree ("media_id");--> statement-breakpoint
ALTER TABLE "site_sections" ADD CONSTRAINT "site_sections_chapter_id_site_about_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."site_about_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_about_cover_media_id_media_id_fk" FOREIGN KEY ("about_cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;