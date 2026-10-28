ALTER TABLE "map_settings" ALTER COLUMN "max_visible_models" SET DEFAULT 10;--> statement-breakpoint
-- An administrator never changed the row (updated_by is null) → it still holds the old start value 5; move it to 10 (§11.36).
UPDATE "map_settings" SET "max_visible_models" = 10, "updated_at" = now() WHERE "id" = 1 AND "updated_by" IS NULL AND "max_visible_models" = 5;
