CREATE TABLE "SOLVER_JOB" (
	"JobID" uuid PRIMARY KEY NOT NULL,
	"UserID" uuid NOT NULL,
	"SolverProfileKey" varchar(128) NOT NULL,
	"SolveMode" varchar(32) NOT NULL,
	"RequestedEngine" varchar(32),
	"DeduplicationKey" varchar(90) NOT NULL,
	"AttemptToken" uuid NOT NULL,
	"Input" jsonb NOT NULL,
	"Status" varchar(32) DEFAULT 'queued' NOT NULL,
	"Result" jsonb,
	"ErrorCode" varchar(128),
	"ErrorMessage" text,
	"ErrorDetails" jsonb,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"EnqueuedAt" timestamp with time zone,
	"CompletedAt" timestamp with time zone,
	"FailedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP CONSTRAINT "UniversityEvent_VenueID_Venue_VenueID_fk";
--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "activityType" varchar(16);--> statement-breakpoint
ALTER TABLE "SOLVER_JOB" ADD CONSTRAINT "SOLVER_JOB_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "solver_job_status_idx" ON "SOLVER_JOB" USING btree ("Status");--> statement-breakpoint
CREATE INDEX "solver_job_created_at_idx" ON "SOLVER_JOB" USING btree ("CreatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "solver_job_duplicate_unique" ON "SOLVER_JOB" USING btree ("UserID","DeduplicationKey");--> statement-breakpoint
ALTER TABLE "UniversityEvent" DROP COLUMN "VenueID";