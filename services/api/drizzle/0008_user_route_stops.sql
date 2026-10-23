CREATE TABLE "user_route_stops" (
	"user_id" text NOT NULL,
	"site_id" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "user_route_stops_user_id_site_id_pk" PRIMARY KEY("user_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "user_route_stops" ADD CONSTRAINT "user_route_stops_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;