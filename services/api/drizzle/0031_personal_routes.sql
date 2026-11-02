CREATE TABLE "user_route_items" (
	"route_id" text NOT NULL,
	"site_id" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "user_route_items_route_id_site_id_pk" PRIMARY KEY("route_id","site_id"),
	CONSTRAINT "user_route_items_position_uq" UNIQUE("route_id","position")
);
--> statement-breakpoint
CREATE TABLE "user_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_route_items" ADD CONSTRAINT "user_route_items_route_id_user_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."user_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_route_items" ADD CONSTRAINT "user_route_items_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_routes_owner_idx" ON "user_routes" USING btree ("user_id");--> statement-breakpoint
INSERT INTO user_routes (id, user_id, name, is_default)
SELECT 'default:' || user_id, user_id, 'Rotam', true FROM user_route_stops GROUP BY user_id;
--> statement-breakpoint
INSERT INTO user_route_items (route_id, site_id, position)
SELECT 'default:' || user_id, site_id, position FROM user_route_stops;
