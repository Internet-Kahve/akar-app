ALTER TABLE "cities" ADD COLUMN "center_lng" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "center_lat" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "zoom" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "zoom_desktop" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "inventory_name" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "inventory_publisher" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "inventory_year" integer;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "inventory_site_count" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "cities_one_default" ON "cities" USING btree ("is_default") WHERE "cities"."is_default";--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_map_complete" CHECK (("cities"."center_lng" is null) = ("cities"."center_lat" is null) and ("cities"."center_lng" is null) = ("cities"."zoom" is null) and ("cities"."zoom_desktop" is null or "cities"."zoom" is not null));--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_default_on_map" CHECK (not "cities"."is_default" or "cities"."center_lng" is not null);