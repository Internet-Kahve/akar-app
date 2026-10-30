CREATE TABLE "narrations" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"variant" text NOT NULL,
	"lang" text NOT NULL,
	"voice" text NOT NULL,
	"media_id" text NOT NULL,
	"text_hash" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "narrations_subject_uq" UNIQUE("site_id","subject_type","subject_id","variant","lang","voice"),
	CONSTRAINT "narrations_subject_type_check" CHECK ("narrations"."subject_type" in ('story_block')),
	CONSTRAINT "narrations_variant_check" CHECK ("narrations"."variant" in ('text', 'simple')),
	CONSTRAINT "narrations_lang_check" CHECK ("narrations"."lang" in ('tr', 'en')),
	CONSTRAINT "narrations_voice_check" CHECK ("narrations"."voice" in ('female', 'male'))
);
--> statement-breakpoint
ALTER TABLE "narrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD COLUMN "text_en_status" text;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD COLUMN "simple_en" text;--> statement-breakpoint
ALTER TABLE "story_blocks" ADD COLUMN "simple_en_status" text;--> statement-breakpoint
ALTER TABLE "narrations" ADD CONSTRAINT "narrations_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "narrations" ADD CONSTRAINT "narrations_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "narrations_media_idx" ON "narrations" USING btree ("media_id");--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_text_en_status_check" CHECK ("story_blocks"."text_en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "story_blocks" ADD CONSTRAINT "story_blocks_simple_en_status_check" CHECK ("story_blocks"."simple_en_status" in ('machine', 'reviewed'));--> statement-breakpoint
ALTER TABLE "story_blocks" DROP CONSTRAINT "story_blocks_audio_media_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "story_blocks" DROP CONSTRAINT "story_blocks_audio_en_media_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "story_blocks" DROP COLUMN "audio_media_id";--> statement-breakpoint
ALTER TABLE "story_blocks" DROP COLUMN "audio_en_media_id";