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
ALTER TABLE "Event" ADD COLUMN "validated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "ImportKey" varchar(64);--> statement-breakpoint
ALTER TABLE "Modules" ADD COLUMN "validated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "PARSE_JOB" ADD CONSTRAINT "PARSE_JOB_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PARSE_JOB" ADD CONSTRAINT "PARSE_JOB_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PARSE_JOB" ADD CONSTRAINT "PARSE_JOB_GroupID_ModuleGrouping_GroupID_fk" FOREIGN KEY ("GroupID") REFERENCES "public"."ModuleGrouping"("GroupID") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parse_job_user_id_idx" ON "PARSE_JOB" USING btree ("UserID");--> statement-breakpoint
CREATE INDEX "parse_job_status_idx" ON "PARSE_JOB" USING btree ("Status");--> statement-breakpoint
CREATE INDEX "parse_job_group_id_idx" ON "PARSE_JOB" USING btree ("GroupID");--> statement-breakpoint
CREATE INDEX "parse_job_created_at_idx" ON "PARSE_JOB" USING btree ("CreatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "parse_job_duplicate_unique" ON "PARSE_JOB" USING btree ("UserID","UniversityID","AdapterKey","FingerprintAlgorithm","PdfStreamHash");--> statement-breakpoint
CREATE UNIQUE INDEX "event_import_key_unique" ON "Event" USING btree ("ImportKey");--> statement-breakpoint
CREATE UNIQUE INDEX "university_event_module_event_unique" ON "UniversityEvent" USING btree ("moduleID","eventID");--> statement-breakpoint
CREATE UNIQUE INDEX "modules_module_code_unique" ON "Modules" USING btree ("moduleCode");--> statement-breakpoint
CREATE UNIQUE INDEX "group_modules_group_module_unique" ON "GroupModules" USING btree ("GroupID","ModuleID");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_university_name_unique" ON "Venue" USING btree ("UniversityID","VenueName");