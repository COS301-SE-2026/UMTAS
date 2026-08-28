ALTER TABLE "AcademicCalendar" ALTER COLUMN "universityId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "AcademicCalendar" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "AcademicCalendar" ADD COLUMN "subscriptions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_calendar_public_name_year_unique" ON "AcademicCalendar" USING btree ("name","year") WHERE "AcademicCalendar"."universityId" is null;--> statement-breakpoint
ALTER TABLE "AcademicCalendar" ADD CONSTRAINT "academic_calendar_public_requires_name" CHECK ("AcademicCalendar"."universityId" is not null or "AcademicCalendar"."name" is not null);--> statement-breakpoint
ALTER TABLE "AcademicCalendar" ADD CONSTRAINT "academic_calendar_public_no_subscriptions" CHECK ("AcademicCalendar"."universityId" is not null or "AcademicCalendar"."subscriptions" = '[]'::jsonb);