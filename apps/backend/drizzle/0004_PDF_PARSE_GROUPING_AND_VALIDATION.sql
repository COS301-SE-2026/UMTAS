CREATE TYPE "public"."AttendanceState" AS ENUM('ATTENDING', 'NOT_ATTENDING');--> statement-breakpoint
CREATE TABLE "EventAttendance" (
	"attendanceID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eventID" uuid NOT NULL,
	"UserID" uuid NOT NULL,
	"eventDate" date NOT NULL,
	"state" "AttendanceState" DEFAULT 'NOT_ATTENDING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PARSE_JOB" (
	"JobID" uuid PRIMARY KEY NOT NULL,
	"UserID" uuid NOT NULL,
	"UniversityID" uuid NOT NULL,
	"AdapterKey" varchar(64) NOT NULL,
	"FileKey" text,
	"ClientPdfStreamHash" varchar(64),
	"PdfStreamHash" varchar(64) NOT NULL,
	"FingerprintAlgorithm" varchar(128) NOT NULL,
	"StreamCount" integer NOT NULL,
	"GroupID" uuid,
	"Status" varchar(32) DEFAULT 'queued' NOT NULL,
	"Result" jsonb,
	"ErrorCode" varchar(128),
	"ErrorMessage" text,
	"ErrorDetails" jsonb,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"CompletedAt" timestamp with time zone,
	"FailedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "GroupModules" (
	"GroupModuleID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"GroupID" uuid NOT NULL,
	"ModuleID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ModuleGrouping" (
	"GroupID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"Hash" varchar(64),
	CONSTRAINT "ModuleGrouping_Hash_unique" UNIQUE("Hash")
);
--> statement-breakpoint
UPDATE "Event" SET "eventCriteria" = jsonb_build_object('type', 'UNIVERSITY', 'date', '', 'startTime', '', 'endTime', '') WHERE "eventCriteria" IS NULL;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "eventCriteria" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "validated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Modules" ADD COLUMN "validated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "GroupID" uuid;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "Degree" varchar(30);--> statement-breakpoint
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PARSE_JOB" ADD CONSTRAINT "PARSE_JOB_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PARSE_JOB" ADD CONSTRAINT "PARSE_JOB_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PARSE_JOB" ADD CONSTRAINT "PARSE_JOB_GroupID_ModuleGrouping_GroupID_fk" FOREIGN KEY ("GroupID") REFERENCES "public"."ModuleGrouping"("GroupID") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GroupModules" ADD CONSTRAINT "GroupModules_GroupID_ModuleGrouping_GroupID_fk" FOREIGN KEY ("GroupID") REFERENCES "public"."ModuleGrouping"("GroupID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GroupModules" ADD CONSTRAINT "GroupModules_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parse_job_user_id_idx" ON "PARSE_JOB" USING btree ("UserID");--> statement-breakpoint
CREATE INDEX "parse_job_status_idx" ON "PARSE_JOB" USING btree ("Status");--> statement-breakpoint
CREATE INDEX "parse_job_group_id_idx" ON "PARSE_JOB" USING btree ("GroupID");--> statement-breakpoint
CREATE INDEX "parse_job_created_at_idx" ON "PARSE_JOB" USING btree ("CreatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "parse_job_duplicate_unique" ON "PARSE_JOB" USING btree ("UserID","UniversityID","AdapterKey","FingerprintAlgorithm","PdfStreamHash");--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_GroupID_ModuleGrouping_GroupID_fk" FOREIGN KEY ("GroupID") REFERENCES "public"."ModuleGrouping"("GroupID") ON DELETE set null ON UPDATE no action;
