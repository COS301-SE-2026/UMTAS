CREATE TYPE "public"."AttendanceState" AS ENUM('ATTENDING', 'NOT_ATTENDING');--> statement-breakpoint
CREATE TABLE "EventAttendance" (
	"eventID" uuid NOT NULL,
	"UserID" uuid NOT NULL,
	"eventDate" date NOT NULL,
	"state" "AttendanceState" DEFAULT 'NOT_ATTENDING' NOT NULL,
	CONSTRAINT "EventAttendance_eventID_UserID_eventDate_pk" PRIMARY KEY("eventID","UserID","eventDate")
);
--> statement-breakpoint
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;