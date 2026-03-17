-- Fix missing default UUID generation for guardians table
ALTER TABLE "public"."guardians" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
