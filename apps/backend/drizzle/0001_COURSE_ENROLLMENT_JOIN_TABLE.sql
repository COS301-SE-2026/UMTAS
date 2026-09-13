CREATE TABLE "CourseEnrollment" (
	"EnrollmentID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UserID" uuid NOT NULL,
	"CourseID" uuid NOT NULL,
	"enrolledAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_CourseID_Course_CourseID_fk" FOREIGN KEY ("CourseID") REFERENCES "public"."Course"("CourseID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "student_course_unique" ON "CourseEnrollment" USING btree ("UserID","CourseID");