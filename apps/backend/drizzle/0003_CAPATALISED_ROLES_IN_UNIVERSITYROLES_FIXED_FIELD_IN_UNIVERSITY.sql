ALTER TABLE "University" RENAME COLUMN "VenueName" TO "UniversityName";--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::text;--> statement-breakpoint
DROP TYPE "public"."RoleType";--> statement-breakpoint
CREATE TYPE "public"."RoleType" AS ENUM('STUDENT', 'UNIVERSITY_ADMIN', 'SYSTEM_ADMIN', 'STUDENT_OWNED');--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"public"."RoleType";--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DATA TYPE "public"."RoleType" USING "role"::"public"."RoleType";