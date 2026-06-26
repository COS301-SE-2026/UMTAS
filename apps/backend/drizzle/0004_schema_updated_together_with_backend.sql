ALTER TABLE "PersonalEvent" RENAME COLUMN "universityEventID" TO "PersonalEventID";--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "eventID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "eventID" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "eventName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "PersonalEvent" ALTER COLUMN "eventID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ALTER COLUMN "universityEventID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ALTER COLUMN "universityEventID" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "UniversityEvent" ALTER COLUMN "moduleID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ALTER COLUMN "eventID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ModuleEnrollment" ALTER COLUMN "ModuleID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ModuleStyling" ALTER COLUMN "UserTimetableID" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ModuleTeaches" ALTER COLUMN "ModuleID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Modules" ALTER COLUMN "moduleID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Modules" ALTER COLUMN "moduleID" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "EventsToTimetables" ALTER COLUMN "eventID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "EventsToTimetables" ALTER COLUMN "timetableID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Timetable" ALTER COLUMN "timetableID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Timetable" ALTER COLUMN "timetableID" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "UserTimetable" ALTER COLUMN "TimetableID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Course" ALTER COLUMN "courseName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "CourseModule" ALTER COLUMN "ModuleID" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "University" ALTER COLUMN "UniversityName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP COLUMN "venue";