CREATE TABLE "map_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"model_min_zoom" double precision DEFAULT 16 NOT NULL,
	"max_visible_models" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "map_settings_single_row" CHECK ("map_settings"."id" = 1),
	CONSTRAINT "map_settings_zoom_range" CHECK ("map_settings"."model_min_zoom" BETWEEN 0 AND 24),
	CONSTRAINT "map_settings_models_range" CHECK ("map_settings"."max_visible_models" BETWEEN 0 AND 50)
);
--> statement-breakpoint
-- The single row with the starting values (decision log §11.2): zoom ≥ 16, at most 5 models.
INSERT INTO "map_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
