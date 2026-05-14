CREATE TYPE "public"."choice_status" AS ENUM('selected', 'alternative', 'rejected');--> statement-breakpoint
CREATE TABLE "enrollment_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"status" "choice_status" NOT NULL,
	"chosen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollment_choices" ADD CONSTRAINT "enrollment_choices_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_choices" ADD CONSTRAINT "enrollment_choices_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_choices_enrollment_id_idx" ON "enrollment_choices" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "enrollment_choices_event_id_idx" ON "enrollment_choices" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_choices_enrollment_event_unique" ON "enrollment_choices" USING btree ("enrollment_id","event_id");--> statement-breakpoint
CREATE INDEX "enrollments_student_id_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollments_module_id_idx" ON "enrollments" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_student_module_unique" ON "enrollments" USING btree ("student_id","module_id");