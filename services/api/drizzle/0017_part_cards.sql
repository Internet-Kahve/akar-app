CREATE TABLE "site_part_card_photos" (
	"card_id" text NOT NULL,
	"position" integer NOT NULL,
	"media_id" text NOT NULL,
	CONSTRAINT "site_part_card_photos_card_id_position_pk" PRIMARY KEY("card_id","position")
);
--> statement-breakpoint
CREATE TABLE "site_part_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"position" integer NOT NULL,
	"parts" text[] NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"source_id" text,
	"trust" "trust_level" NOT NULL,
	CONSTRAINT "site_part_cards_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
ALTER TABLE "site_part_card_photos" ADD CONSTRAINT "site_part_card_photos_card_id_site_part_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."site_part_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_part_card_photos" ADD CONSTRAINT "site_part_card_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD CONSTRAINT "site_part_cards_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_part_cards" ADD CONSTRAINT "site_part_cards_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_part_card_photos_media_idx" ON "site_part_card_photos" USING btree ("media_id");--> statement-breakpoint
ALTER TABLE "site_part_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_part_card_photos" ENABLE ROW LEVEL SECURITY;