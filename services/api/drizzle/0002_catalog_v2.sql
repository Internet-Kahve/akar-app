CREATE TYPE "public"."media_kind" AS ENUM('photo', 'model', 'audio');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."site_role" AS ENUM('akar', 'hayrat', 'both');--> statement-breakpoint
CREATE TYPE "public"."site_tier" AS ENUM('Hero', 'Tier 2', 'Tier 1');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('book', 'article', 'archive', 'web', 'field');--> statement-breakpoint
CREATE TYPE "public"."trust_level" AS ENUM('verified', 'inferred', 'representative');--> statement-breakpoint
CREATE TYPE "public"."card_kind" AS ENUM('portrait', 'photo', 'document');--> statement-breakpoint
CREATE TYPE "public"."section_kind" AS ENUM('history', 'architecture', 'waqf');--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "card_kind" NOT NULL,
	"title" text NOT NULL,
	"title_en" text,
	"body" text DEFAULT '' NOT NULL,
	"body_en" text,
	"media_id" text NOT NULL,
	"source_id" text,
	"trust" "trust_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history_images" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"position" integer NOT NULL,
	"media_id" text NOT NULL,
	"present_media_id" text,
	"caption" text DEFAULT '' NOT NULL,
	"caption_en" text,
	"date_label" text DEFAULT '' NOT NULL,
	"source_id" text,
	"trust" "trust_level" NOT NULL,
	"camera" jsonb,
	CONSTRAINT "history_images_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text NOT NULL,
	"start_year" integer,
	"end_year" integer,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_city_name_uq" UNIQUE("city_id","name"),
	CONSTRAINT "regions_id_city_uq" UNIQUE("id","city_id")
);
--> statement-breakpoint
CREATE TABLE "role_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text NOT NULL,
	"waqf_role" "site_role" NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_media" (
	"site_id" text NOT NULL,
	"media_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "site_media_site_id_media_id_pk" PRIMARY KEY("site_id","media_id"),
	CONSTRAINT "site_media_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
CREATE TABLE "site_sections" (
	"site_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" "section_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"body_en" text,
	"trust" "trust_level" NOT NULL,
	"source_id" text,
	CONSTRAINT "site_sections_site_id_id_pk" PRIMARY KEY("site_id","id"),
	CONSTRAINT "site_sections_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
CREATE TABLE "site_sources" (
	"site_id" text NOT NULL,
	"source_id" text NOT NULL,
	"position" integer NOT NULL,
	"locator" text,
	CONSTRAINT "site_sources_site_id_source_id_pk" PRIMARY KEY("site_id","source_id"),
	CONSTRAINT "site_sources_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
CREATE TABLE "site_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text NOT NULL,
	"category_id" text NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"region_id" text,
	"name" text NOT NULL,
	"name_en" text,
	"type_id" text,
	"period_id" text,
	"year" text DEFAULT '' NOT NULL,
	"architect" text DEFAULT '' NOT NULL,
	"patron" text,
	"era" text,
	"address" text,
	"role" "site_role",
	"related_site_id" text,
	"description" text DEFAULT '' NOT NULL,
	"description_en" text,
	"minutes" integer DEFAULT 0 NOT NULL,
	"tier" "site_tier" NOT NULL,
	"trust" "trust_level" NOT NULL,
	"source_summary" text DEFAULT '' NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"editor_version" integer,
	"cover_media_id" text,
	"opening_camera" jsonb,
	"location" geometry(Point,4326),
	"location_source" text,
	"dedupe_key" text NOT NULL,
	"import_meta" jsonb,
	"search_text" text NOT NULL,
	"sort_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_editor_version" CHECK ("sites"."editor_version" IS NULL OR "sites"."editor_version" = 2),
	CONSTRAINT "sites_published_complete" CHECK ("sites"."status" <> 'published' OR ("sites"."location" IS NOT NULL AND "sites"."type_id" IS NOT NULL AND "sites"."location_source" IS DISTINCT FROM 'nominatim-neighbourhood' AND "sites"."location_source" IS DISTINCT FROM 'nominatim-street'))
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"kind" "source_kind" NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"page" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"trust" "trust_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_blocks" (
	"site_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"text_en" text,
	"simple" text NOT NULL,
	"trust" "trust_level" NOT NULL,
	"photo_id" text,
	"source_id" text,
	"show_card" boolean,
	"card_id" text,
	"camera" jsonb,
	"highlights" text[] DEFAULT '{}'::text[] NOT NULL,
	"audio_media_id" text,
	"audio_en_media_id" text,
	CONSTRAINT "story_blocks_site_id_id_pk" PRIMARY KEY("site_id","id"),
	CONSTRAINT "story_blocks_order_uq" UNIQUE("site_id","position")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "media_kind" NOT NULL,
	"mime" text NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"title_en" text,
	"description" text DEFAULT '' NOT NULL,
	"license" text NOT NULL,
	"source_id" text,
	"trust" "trust_level" NOT NULL,
	"bytes" integer,
	"parts" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_url_not_data" CHECK ("media"."url" NOT LIKE 'data:%')
);
--> statement-breakpoint
CREATE TABLE "catalog_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"description" text NOT NULL,
	"theme" text NOT NULL,
	"badge_title" text,
	"badge_media_id" text,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"quiz_id" text PRIMARY KEY NOT NULL,
	"correct_index" smallint NOT NULL,
	CONSTRAINT "quiz_answers_index_range" CHECK ("quiz_answers"."correct_index" BETWEEN 0 AND 2)
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"question" text NOT NULL,
	"question_en" text,
	"options" text[] NOT NULL,
	"options_en" text[],
	"hint" text,
	"explanation" text DEFAULT '' NOT NULL,
	"source_id" text,
	"trust" "trust_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quizzes_three_options" CHECK (cardinality("quizzes"."options") = 3),
	CONSTRAINT "quizzes_three_options_en" CHECK ("quizzes"."options_en" IS NULL OR cardinality("quizzes"."options_en") = 3)
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"route_id" text NOT NULL,
	"position" integer NOT NULL,
	"site_id" text NOT NULL,
	"quiz_id" text,
	"history_image_id" text,
	CONSTRAINT "route_stops_route_id_position_pk" PRIMARY KEY("route_id","position"),
	CONSTRAINT "route_stops_site_uq" UNIQUE("route_id","site_id")
);
--> statement-breakpoint
CREATE TABLE "point_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"subject_id" text NOT NULL,
	"points" integer NOT NULL,
	"receipt_id" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "point_events_receipt_uq" UNIQUE("receipt_id"),
	CONSTRAINT "point_events_once_uq" UNIQUE("user_id","action","subject_id")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_present_media_id_media_id_fk" FOREIGN KEY ("present_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_images" ADD CONSTRAINT "history_images_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_media" ADD CONSTRAINT "site_media_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_media" ADD CONSTRAINT "site_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_sections" ADD CONSTRAINT "site_sections_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_sections" ADD CONSTRAINT "site_sections_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_sources" ADD CONSTRAINT "site_sources_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_sources" ADD CONSTRAINT "site_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_types" ADD CONSTRAINT "site_types_category_id_role_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."role_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_type_id_site_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."site_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_related_site_fk" FOREIGN KEY ("related_site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_region_city_fk" FOREIGN KEY ("region_id","city_id") REFERENCES "public"."regions"("id","city_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_audio_media_id_media_id_fk" FOREIGN KEY ("audio_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_audio_en_media_id_media_id_fk" FOREIGN KEY ("audio_en_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_routes" ADD CONSTRAINT "catalog_routes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_routes" ADD CONSTRAINT "catalog_routes_badge_media_id_media_id_fk" FOREIGN KEY ("badge_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_catalog_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."catalog_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_history_image_id_history_images_id_fk" FOREIGN KEY ("history_image_id") REFERENCES "public"."history_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sites_city_dedupe_idx" ON "sites" USING btree ("city_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "sites_location_gist" ON "sites" USING gist ("location");--> statement-breakpoint
CREATE INDEX "sites_published_order_idx" ON "sites" USING btree ("sort_name" COLLATE "C","id" COLLATE "C") WHERE "sites"."status" = 'published';--> statement-breakpoint
CREATE INDEX "sites_city_idx" ON "sites" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "sites_region_idx" ON "sites" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "sites_type_idx" ON "sites" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "story_blocks_card_idx" ON "story_blocks" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "catalog_routes_published_idx" ON "catalog_routes" USING btree ("id") WHERE "catalog_routes"."status" = 'published';--> statement-breakpoint
CREATE INDEX "catalog_routes_city_idx" ON "catalog_routes" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "quizzes_site_idx" ON "quizzes" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "point_events_user_idx" ON "point_events" USING btree ("user_id");