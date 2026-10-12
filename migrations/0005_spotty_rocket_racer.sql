DELETE FROM "reading_progress" a USING "reading_progress" b
WHERE a."user_id" = b."user_id" AND a."book_id" = b."book_id"
  AND (a."updated_at" < b."updated_at" OR (a."updated_at" = b."updated_at" AND a."id" < b."id"));--> statement-breakpoint
ALTER TABLE "reading_progress" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_progress" ALTER COLUMN "book_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_book_unique" ON "reading_progress" ("user_id","book_id");
