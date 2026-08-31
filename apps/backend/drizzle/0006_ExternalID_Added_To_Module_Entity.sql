ALTER TABLE "Course" ALTER COLUMN "CourseName" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "Modules" ADD COLUMN "ExternalID" varchar(255);