ALTER TABLE "Course" ADD COLUMN "ExternalID" varchar(255);--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_University_ExternalID_Unique" UNIQUE("UniversityID","ExternalID");