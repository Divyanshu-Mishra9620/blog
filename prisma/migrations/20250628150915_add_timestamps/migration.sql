-- Remove createdAt and updatedAt columns from Post table
ALTER TABLE "Post" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "updatedAt";
