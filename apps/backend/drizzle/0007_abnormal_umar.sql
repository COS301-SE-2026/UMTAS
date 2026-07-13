CREATE TABLE "SOLVER_JOB" (
	"JobID" varchar(255) PRIMARY KEY NOT NULL,
	"SolverProfileKey" varchar(128) NOT NULL,
	"SolveMode" varchar(32) NOT NULL,
	"RequestedEngine" varchar(32),
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
CREATE INDEX "solver_job_status_idx" ON "SOLVER_JOB" USING btree ("Status");--> statement-breakpoint
CREATE INDEX "solver_job_created_at_idx" ON "SOLVER_JOB" USING btree ("CreatedAt");