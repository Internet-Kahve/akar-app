CREATE TABLE "walking_legs" (
	"from_lng" double precision NOT NULL,
	"from_lat" double precision NOT NULL,
	"to_lng" double precision NOT NULL,
	"to_lat" double precision NOT NULL,
	"geometry" jsonb,
	"meters" integer,
	"seconds" integer,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failed_at" timestamp with time zone,
	CONSTRAINT "walking_legs_from_lng_from_lat_to_lng_to_lat_pk" PRIMARY KEY("from_lng","from_lat","to_lng","to_lat"),
	CONSTRAINT "walking_legs_result" CHECK (("walking_legs"."geometry" IS NULL) = ("walking_legs"."failed_at" IS NOT NULL) AND ("walking_legs"."geometry" IS NULL) = ("walking_legs"."meters" IS NULL) AND ("walking_legs"."meters" IS NULL) = ("walking_legs"."seconds" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "walking_legs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "walking_legs_computed_idx" ON "walking_legs" USING btree ("computed_at");