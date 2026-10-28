CREATE TABLE "site_map_placements" (
	"site_id" text PRIMARY KEY NOT NULL,
	"location" geometry(Point,4326),
	"heading_deg" double precision DEFAULT 0 NOT NULL,
	"scale" double precision DEFAULT 1 NOT NULL,
	"altitude_m" double precision DEFAULT 0 NOT NULL,
	"anchor_node" text,
	"hidden_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kept_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_map_placements_heading" CHECK ("site_map_placements"."heading_deg" >= 0 AND "site_map_placements"."heading_deg" < 360),
	CONSTRAINT "site_map_placements_scale" CHECK ("site_map_placements"."scale" >= 0.1 AND "site_map_placements"."scale" <= 10),
	CONSTRAINT "site_map_placements_altitude" CHECK ("site_map_placements"."altitude_m" >= -50 AND "site_map_placements"."altitude_m" <= 200),
	CONSTRAINT "site_map_placements_anchor" CHECK ("site_map_placements"."anchor_node" IS NULL OR char_length("site_map_placements"."anchor_node") <= 200),
	CONSTRAINT "site_map_placements_points" CHECK (jsonb_typeof("site_map_placements"."hidden_points") = 'array' AND jsonb_array_length("site_map_placements"."hidden_points") <= 50 AND jsonb_typeof("site_map_placements"."kept_points") = 'array' AND jsonb_array_length("site_map_placements"."kept_points") <= 50)
);
--> statement-breakpoint
ALTER TABLE "site_map_placements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "triangles" integer;--> statement-breakpoint
ALTER TABLE "site_map_placements" ADD CONSTRAINT "site_map_placements_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;