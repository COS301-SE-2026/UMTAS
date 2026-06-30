ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::text;--> statement-breakpoint
DROP TYPE "public"."RoleType";--> statement-breakpoint
CREATE TYPE "public"."RoleType" AS ENUM('STUDENT', 'STUDENT_OWNED', 'UNIVERSITY_ADMIN', 'UNIVERSITY_ADMIN_PENDING', 'LECTURER', 'LECTURER_PENDING', 'SYSTEM_ADMIN');--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"public"."RoleType";--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DATA TYPE "public"."RoleType" USING "role"::"public"."RoleType";