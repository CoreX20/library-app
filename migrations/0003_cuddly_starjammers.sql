ALTER TABLE "books" ALTER COLUMN "video_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "bookFile" text;