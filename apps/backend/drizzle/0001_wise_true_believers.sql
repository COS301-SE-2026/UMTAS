CREATE TYPE "public"."restriction_type" AS ENUM('public_holiday', 'recess', 'closure', 'exam_period', 'day_swap');--> statement-breakpoint
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
ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restrictions" ADD CONSTRAINT "restrictions_academic_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("academic_calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academic_calendars_university_id_idx" ON "academic_calendars" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "restrictions_calendar_type_idx" ON "restrictions" USING btree ("academic_calendar_id","type");--> statement-breakpoint
CREATE INDEX "restrictions_date_range_idx" ON "restrictions" USING btree ("date_start","date_end");--> statement-breakpoint
CREATE UNIQUE INDEX "universities_email_domain_unique" ON "universities" USING btree ("email_domain");