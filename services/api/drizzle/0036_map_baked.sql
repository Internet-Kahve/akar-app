ALTER TABLE "sites" ADD COLUMN "map_baked_media_id" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "map_baked_night_media_id" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "hide_closed_interior" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_map_baked_media_id_media_id_fk" FOREIGN KEY ("map_baked_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_map_baked_night_media_id_media_id_fk" FOREIGN KEY ("map_baked_night_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;