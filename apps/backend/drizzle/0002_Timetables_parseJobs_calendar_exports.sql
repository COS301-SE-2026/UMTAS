CREATE TYPE "public"."export_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."export_type" AS ENUM('google_calendar', 'ics');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."timetable_source" AS ENUM('solver', 'manual', 'pdf_import', 'api_import');--> statement-breakpoint
CREATE TYPE "public"."timetable_status" AS ENUM('draft', 'generated', 'manual', 'exported');--> statement-breakpoint
CREATE TABLE "calendar_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timetable_id" uuid NOT NULL,
	"export_type" "export_type" NOT NULL,
	"status" "export_status" DEFAULT 'pending' NOT NULL,
	"export_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parse_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_calendar_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_file" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timetable_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"resolved_date" date NOT NULL,
	"resolved_start_time" time NOT NULL,
	"resolved_duration_mins" integer NOT NULL,
	"resolved_venue" text
);
--> statement-breakpoint
CREATE TABLE "timetables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"academic_calendar_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" timetable_status DEFAULT 'draft' NOT NULL,
	"source" timetable_source NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_exports" ADD CONSTRAINT "calendar_exports_timetable_id_timetables_id_fk" FOREIGN KEY ("timetable_id") REFERENCES "public"."timetables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parse_jobs" ADD CONSTRAINT "parse_jobs_academic_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("academic_calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_timetable_id_timetables_id_fk" FOREIGN KEY ("timetable_id") REFERENCES "public"."timetables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_academic_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("academic_calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_exports_timetable_id_idx" ON "calendar_exports" USING btree ("timetable_id");--> statement-breakpoint
CREATE INDEX "calendar_exports_status_idx" ON "calendar_exports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "parse_jobs_academic_calendar_id_idx" ON "parse_jobs" USING btree ("academic_calendar_id");--> statement-breakpoint
CREATE INDEX "parse_jobs_status_idx" ON "parse_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "timetable_entries_timetable_id_idx" ON "timetable_entries" USING btree ("timetable_id");--> statement-breakpoint
CREATE INDEX "timetable_entries_resolved_date_idx" ON "timetable_entries" USING btree ("resolved_date");--> statement-breakpoint
CREATE INDEX "timetable_entries_event_id_idx" ON "timetable_entries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "timetables_student_id_idx" ON "timetables" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "timetables_academic_calendar_id_idx" ON "timetables" USING btree ("academic_calendar_id");