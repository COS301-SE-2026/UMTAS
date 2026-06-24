ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_userID_user_id_fk";
--> statement-breakpoint
ALTER TABLE "Event" DROP COLUMN "userID";--> statement-breakpoint
ALTER TABLE "Modules" DROP COLUMN "styling";--> statement-breakpoint
ALTER TABLE "Modules" DROP COLUMN "userID";--> statement-breakpoint
ALTER TABLE "Timetable" DROP COLUMN "userID";