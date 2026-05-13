CREATE TYPE "public"."restriction_type" AS ENUM('public_holiday', 'recess', 'closure', 'exam_period', 'day_swap');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('lecture', 'tutorial', 'lab', 'test', 'exam', 'bootcamp');--> statement-breakpoint
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
	"id" uuid PRIMARY KEY NOT NULL,
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
CREATE TABLE "hello_world" (
	"id" uuid PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'Africa/Johannesburg' NOT NULL,
	"region_code" text NOT NULL,
	"semester_start" date NOT NULL,
	"semester_end" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_calendar_id" uuid NOT NULL,
	"type" "restriction_type" NOT NULL,
	"date_start" date NOT NULL,
	"date_end" date NOT NULL,
	"source_day_of_week" smallint,
	"target_day_of_week" smallint,
	"label" text NOT NULL,
	"criteria" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"email_domain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bootcamp_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"start_datetime" timestamp with time zone NOT NULL,
	"end_datetime" timestamp with time zone NOT NULL,
	"organiser" text,
	"location" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "exam_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"exam_date" date NOT NULL,
	"start_time" time,
	"duration_minutes" integer NOT NULL,
	"location" text,
	"seating_plan" jsonb
);
--> statement-breakpoint
CREATE TABLE "lab_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"week_start" integer NOT NULL,
	"week_end" integer NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"location" text,
	"lecturer" text
);
--> statement-breakpoint
CREATE TABLE "lecture_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"week_start" integer NOT NULL,
	"week_end" integer NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"location" text,
	"lecturer" text
);
--> statement-breakpoint
CREATE TABLE "test_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"test_date" date NOT NULL,
	"start_time" time,
	"duration_minutes" integer NOT NULL,
	"location" text,
	"lecturer" text,
	"no_overlap_with" jsonb
);
--> statement-breakpoint
CREATE TABLE "tutorial_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"week_start" integer NOT NULL,
	"week_end" integer NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"location" text,
	"lecturer" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_calendar_id" uuid NOT NULL,
	"parse_job_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"faculty" text,
	"semester_label" text NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restrictions" ADD CONSTRAINT "restrictions_academic_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("academic_calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bootcamp_criteria" ADD CONSTRAINT "bootcamp_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bootcamp_criteria" ADD CONSTRAINT "bootcamp_criteria_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_criteria" ADD CONSTRAINT "exam_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_criteria" ADD CONSTRAINT "exam_criteria_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_criteria" ADD CONSTRAINT "lab_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_criteria" ADD CONSTRAINT "lab_criteria_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecture_criteria" ADD CONSTRAINT "lecture_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecture_criteria" ADD CONSTRAINT "lecture_criteria_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_criteria" ADD CONSTRAINT "test_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_criteria" ADD CONSTRAINT "test_criteria_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_criteria" ADD CONSTRAINT "tutorial_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_criteria" ADD CONSTRAINT "tutorial_criteria_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_academic_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("academic_calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_key_unique" ON "rateLimit" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "academic_calendars_university_id_idx" ON "academic_calendars" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "restrictions_calendar_type_idx" ON "restrictions" USING btree ("academic_calendar_id","type");--> statement-breakpoint
CREATE INDEX "restrictions_date_range_idx" ON "restrictions" USING btree ("date_start","date_end");--> statement-breakpoint
CREATE UNIQUE INDEX "universities_email_domain_unique" ON "universities" USING btree ("email_domain");--> statement-breakpoint
CREATE UNIQUE INDEX "bootcamp_criteria_event_id_unique" ON "bootcamp_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "bootcamp_criteria_created_by_idx" ON "bootcamp_criteria" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_criteria_event_id_unique" ON "exam_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "exam_criteria_module_id_idx" ON "exam_criteria" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lab_criteria_event_id_unique" ON "lab_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "lab_criteria_module_id_idx" ON "lab_criteria" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "lab_criteria_schedule_idx" ON "lab_criteria" USING btree ("day_of_week","start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "lecture_criteria_event_id_unique" ON "lecture_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "lecture_criteria_module_id_idx" ON "lecture_criteria" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "lecture_criteria_schedule_idx" ON "lecture_criteria" USING btree ("day_of_week","start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "test_criteria_event_id_unique" ON "test_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "test_criteria_module_id_idx" ON "test_criteria" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_criteria_event_id_unique" ON "tutorial_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tutorial_criteria_module_id_idx" ON "tutorial_criteria" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "tutorial_criteria_schedule_idx" ON "tutorial_criteria" USING btree ("day_of_week","start_time");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "modules_academic_calendar_id_idx" ON "modules" USING btree ("academic_calendar_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modules_calendar_code_unique" ON "modules" USING btree ("academic_calendar_id","code");