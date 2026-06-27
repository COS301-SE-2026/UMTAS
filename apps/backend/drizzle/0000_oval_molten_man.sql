CREATE TYPE "public"."RestrictionType" AS ENUM('DATE-SWAP', 'PUBLIC-HOLIDAY', 'RECESS', 'CLOSURE', 'EXAM-PERIOD', 'DAY-SWAP');--> statement-breakpoint
CREATE TYPE "public"."RoleType" AS ENUM('STUDENT', 'UNIVERSITY_ADMIN', 'SYSTEM_ADMIN', 'STUDENT_OWNED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"lastRequest" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" uuid NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"impersonatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'student' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"banReason" text,
	"banExpires" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Event" (
	"eventID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eventName" varchar(32) NOT NULL,
	"eventCode" varchar(10),
	"eventCriteria" jsonb,
	"isRecurring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PersonalEvent" (
	"PersonalEventID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UserID" uuid,
	"eventID" uuid
);
--> statement-breakpoint
CREATE TABLE "UniversityEvent" (
	"universityEventID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moduleID" uuid,
	"eventID" uuid,
	"VenueID" uuid
);
--> statement-breakpoint
CREATE TABLE "ModuleEnrollment" (
	"ModuleID" uuid NOT NULL,
	"UserID" uuid NOT NULL,
	CONSTRAINT "ModuleEnrollment_ModuleID_UserID_pk" PRIMARY KEY("ModuleID","UserID")
);
--> statement-breakpoint
CREATE TABLE "ModuleStyling" (
	"ModuleID" uuid NOT NULL,
	"UserTimetableID" uuid,
	"styling" jsonb DEFAULT '{"colour":""}'::jsonb NOT NULL,
	CONSTRAINT "ModuleStyling_ModuleID_UserTimetableID_pk" PRIMARY KEY("ModuleID","UserTimetableID")
);
--> statement-breakpoint
CREATE TABLE "ModuleTeaches" (
	"ModuleID" uuid NOT NULL,
	"UserID" uuid NOT NULL,
	CONSTRAINT "ModuleTeaches_ModuleID_UserID_pk" PRIMARY KEY("ModuleID","UserID")
);
--> statement-breakpoint
CREATE TABLE "Modules" (
	"moduleID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moduleCode" varchar(10) NOT NULL,
	"moduleName" varchar(256) NOT NULL,
	"moduleDescription" text
);
--> statement-breakpoint
CREATE TABLE "EventsToTimetables" (
	"eventID" uuid NOT NULL,
	"timetableID" uuid NOT NULL,
	CONSTRAINT "EventsToTimetables_eventID_timetableID_pk" PRIMARY KEY("eventID","timetableID")
);
--> statement-breakpoint
CREATE TABLE "Timetable" (
	"timetableID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timetableName" varchar(32),
	CONSTRAINT "Timetable_timetableID_unique" UNIQUE("timetableID")
);
--> statement-breakpoint
CREATE TABLE "UserTimetable" (
	"UserTimetableID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UserID" uuid NOT NULL,
	"TimetableID" uuid NOT NULL
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
	"courseName" varchar(30) NOT NULL,
	"UniversityID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CourseModule" (
	"ModuleID" uuid NOT NULL,
	"CourseID" uuid NOT NULL,
	CONSTRAINT "CourseModule_CourseID_ModuleID_pk" PRIMARY KEY("CourseID","ModuleID")
);
--> statement-breakpoint
CREATE TABLE "University" (
	"UniversityID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UniversityName" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UniversityRole" (
	"UserID" uuid NOT NULL,
	"UniversityID" uuid NOT NULL,
	"role" "RoleType" DEFAULT 'STUDENT' NOT NULL,
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
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PersonalEvent" ADD CONSTRAINT "PersonalEvent_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PersonalEvent" ADD CONSTRAINT "PersonalEvent_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD CONSTRAINT "UniversityEvent_moduleID_Modules_moduleID_fk" FOREIGN KEY ("moduleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD CONSTRAINT "UniversityEvent_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityEvent" ADD CONSTRAINT "UniversityEvent_VenueID_Venue_VenueID_fk" FOREIGN KEY ("VenueID") REFERENCES "public"."Venue"("VenueID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleEnrollment" ADD CONSTRAINT "ModuleEnrollment_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleEnrollment" ADD CONSTRAINT "ModuleEnrollment_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleStyling" ADD CONSTRAINT "ModuleStyling_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleStyling" ADD CONSTRAINT "ModuleStyling_UserTimetableID_UserTimetable_UserTimetableID_fk" FOREIGN KEY ("UserTimetableID") REFERENCES "public"."UserTimetable"("UserTimetableID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleTeaches" ADD CONSTRAINT "ModuleTeaches_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleTeaches" ADD CONSTRAINT "ModuleTeaches_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventsToTimetables" ADD CONSTRAINT "EventsToTimetables_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventsToTimetables" ADD CONSTRAINT "EventsToTimetables_timetableID_Timetable_timetableID_fk" FOREIGN KEY ("timetableID") REFERENCES "public"."Timetable"("timetableID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_key_unique" ON "rateLimit" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expiresAt");