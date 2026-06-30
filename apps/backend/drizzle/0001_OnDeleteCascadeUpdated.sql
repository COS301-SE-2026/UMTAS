ALTER TABLE "UserTimetable" DROP CONSTRAINT "UserTimetable_TimetableID_Timetable_timetableID_fk";
--> statement-breakpoint
ALTER TABLE "UserTimetable" ADD CONSTRAINT "UserTimetable_TimetableID_Timetable_timetableID_fk" FOREIGN KEY ("TimetableID") REFERENCES "public"."Timetable"("timetableID") ON DELETE cascade ON UPDATE no action;