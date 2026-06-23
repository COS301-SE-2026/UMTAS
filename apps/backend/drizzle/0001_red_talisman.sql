CREATE TYPE "public"."RestrictionType" AS ENUM('DATE-SWAP', 'PUBLIC-HOLIDAY', 'RECESS', 'CLOSURE', 'EXAM-PERIOD', 'DAY-SWAP');--> statement-breakpoint
CREATE TYPE "public"."RoleType" AS ENUM('student', 'UniversityAdmin', 'SystemAdmin', 'studentOwned');--> statement-breakpoint
CREATE TABLE "PersonalEvent" (
	"universityEventID" serial PRIMARY KEY NOT NULL,
	"UserID" uuid,
	"eventID" integer
);
--> statement-breakpoint
CREATE TABLE "ModuleEnrollment" (
	"ModuleID" integer NOT NULL,
	"UserID" uuid NOT NULL,
	CONSTRAINT "ModuleEnrollment_ModuleID_UserID_pk" PRIMARY KEY("ModuleID","UserID")
);
--> statement-breakpoint
CREATE TABLE "ModuleStyling" (
	"ModuleID" integer NOT NULL,
	"UserTimetableID" uuid NOT NULL,
	"styling" jsonb DEFAULT '{"colour":""}'::jsonb NOT NULL,
	CONSTRAINT "ModuleStyling_ModuleID_UserTimetableID_pk" PRIMARY KEY("ModuleID","UserTimetableID")
);
--> statement-breakpoint
CREATE TABLE "ModuleTeaches" (
	"ModuleID" integer NOT NULL,
	"UserID" uuid NOT NULL,
	CONSTRAINT "ModuleTeaches_ModuleID_UserID_pk" PRIMARY KEY("ModuleID","UserID")
);
--> statement-breakpoint
CREATE TABLE "UserTimetable" (
	"UserTimetableID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UserID" uuid NOT NULL,
	"TimetableID" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AcademicCalendar" (
	"CalendarID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UniversityID" uuid,
	"CreationDate" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RestrictedDates" (
	"RestrictionID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"CalendarID" uuid NOT NULL,
	"Details" jsonb DEFAULT '{"dateStart":""}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "Course" (
	"courseID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"courseName" varchar(30),
	"UniversityID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CourseModule" (
	"ModuleID" integer NOT NULL,
	"CourseID" uuid NOT NULL,
	CONSTRAINT "CourseModule_CourseID_ModuleID_pk" PRIMARY KEY("CourseID","ModuleID")
);
--> statement-breakpoint
CREATE TABLE "University" (
	"UniversityID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"VenueName" varchar(30)
);
--> statement-breakpoint
CREATE TABLE "UniversityRole" (
	"UserID" uuid NOT NULL,
	"UniversityID" uuid NOT NULL,
	"role" "RoleType" DEFAULT 'student' NOT NULL,
	CONSTRAINT "UniversityRole_UniversityID_UserID_pk" PRIMARY KEY("UniversityID","UserID")
);
--> statement-breakpoint
CREATE TABLE "EventVenue" (
	"VenueID" uuid NOT NULL,
	"UniversityID" uuid NOT NULL,
	CONSTRAINT "EventVenue_UniversityID_VenueID_pk" PRIMARY KEY("UniversityID","VenueID")
);
--> statement-breakpoint
CREATE TABLE "Venue" (
	"VenueID" uuid PRIMARY KEY NOT NULL,
	"VenueName" varchar(30)
);
--> statement-breakpoint
ALTER TABLE "LectureEv" RENAME TO "UniversityEvent";--> statement-breakpoint
ALTER TABLE "UniversityEvent" RENAME COLUMN "lectureID" TO "universityEventID";--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP CONSTRAINT "LectureEv_moduleID_Modules_moduleID_fk";
--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP CONSTRAINT "LectureEv_eventID_Event_eventID_fk";
--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD COLUMN "VenueID" uuid;--> statement-breakpoint
ALTER TABLE "PersonalEvent" ADD CONSTRAINT "PersonalEvent_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PersonalEvent" ADD CONSTRAINT "PersonalEvent_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleEnrollment" ADD CONSTRAINT "ModuleEnrollment_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleEnrollment" ADD CONSTRAINT "ModuleEnrollment_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleStyling" ADD CONSTRAINT "ModuleStyling_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleStyling" ADD CONSTRAINT "ModuleStyling_UserTimetableID_UserTimetable_UserTimetableID_fk" FOREIGN KEY ("UserTimetableID") REFERENCES "public"."UserTimetable"("UserTimetableID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleTeaches" ADD CONSTRAINT "ModuleTeaches_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleTeaches" ADD CONSTRAINT "ModuleTeaches_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserTimetable" ADD CONSTRAINT "UserTimetable_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserTimetable" ADD CONSTRAINT "UserTimetable_TimetableID_Timetable_timetableID_fk" FOREIGN KEY ("TimetableID") REFERENCES "public"."Timetable"("timetableID") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AcademicCalendar" ADD CONSTRAINT "AcademicCalendar_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RestrictedDates" ADD CONSTRAINT "RestrictedDates_CalendarID_AcademicCalendar_CalendarID_fk" FOREIGN KEY ("CalendarID") REFERENCES "public"."AcademicCalendar"("CalendarID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_CourseID_Course_courseID_fk" FOREIGN KEY ("CourseID") REFERENCES "public"."Course"("courseID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityRole" ADD CONSTRAINT "UniversityRole_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityRole" ADD CONSTRAINT "UniversityRole_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventVenue" ADD CONSTRAINT "EventVenue_VenueID_Venue_VenueID_fk" FOREIGN KEY ("VenueID") REFERENCES "public"."Venue"("VenueID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventVenue" ADD CONSTRAINT "EventVenue_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_userID_user_id_fk" FOREIGN KEY ("userID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD CONSTRAINT "UniversityEvent_moduleID_Modules_moduleID_fk" FOREIGN KEY ("moduleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD CONSTRAINT "UniversityEvent_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD CONSTRAINT "UniversityEvent_VenueID_Venue_VenueID_fk" FOREIGN KEY ("VenueID") REFERENCES "public"."Venue"("VenueID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_timetableID_unique" UNIQUE("timetableID");