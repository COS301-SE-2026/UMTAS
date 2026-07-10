ALTER TABLE "Event" ADD COLUMN "activityType" varchar(16);
--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP COLUMN IF EXISTS "VenueID";
