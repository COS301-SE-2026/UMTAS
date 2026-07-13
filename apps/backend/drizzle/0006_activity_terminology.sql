ALTER TABLE "UniversityEvent" DROP CONSTRAINT "UniversityEvent_VenueID_Venue_VenueID_fk";
--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "activityType" varchar(16);--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP COLUMN "VenueID";