ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::text; -- NOSONAR: generated PostgreSQL migration keeps the existing default literal. --> statement-breakpoint
DROP TYPE public."RoleType"; -- NOSONAR: generated PostgreSQL migration preserves the case-sensitive type name. --> statement-breakpoint
CREATE TYPE public."RoleType" AS ENUM('STUDENT', 'STUDENT_OWNED', 'UNIVERSITY_ADMIN', 'UNIVERSITY_ADMIN_PENDING', 'LECTURER', 'LECTURER_PENDING', 'SYSTEM_ADMIN'); -- NOSONAR: generated PostgreSQL migration preserves enum literals and the case-sensitive type name. --> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::public."RoleType"; -- NOSONAR: generated PostgreSQL migration keeps the existing default literal and type name. --> statement-breakpoint
ALTER TABLE "UniversityRole" ALTER COLUMN "role" SET DATA TYPE public."RoleType" USING "role"::public."RoleType"; -- NOSONAR: generated PostgreSQL migration preserves the case-sensitive type name.
