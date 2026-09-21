CREATE TYPE "public"."SessionAttendanceCaptureMethod" AS ENUM('NFC', 'BARCODE', 'CAMERA', 'MANUAL');--> statement-breakpoint
CREATE TABLE "AttendanceSession" (
	"SessionID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eventID" uuid NOT NULL,
	"scheduledStartAt" timestamp with time zone NOT NULL,
	"scheduledEndAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_session_schedule_check" CHECK ("AttendanceSession"."scheduledStartAt" < "AttendanceSession"."scheduledEndAt")
);
--> statement-breakpoint
CREATE TABLE "SessionAttendance" (
	"AttendanceID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"SessionID" uuid NOT NULL,
	"UserID" uuid,
	"guestCount" integer,
	"captureMethod" "SessionAttendanceCaptureMethod" NOT NULL,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_attendance_shape_check" CHECK ((("SessionAttendance"."UserID" IS NOT NULL AND "SessionAttendance"."guestCount" IS NULL) OR ("SessionAttendance"."UserID" IS NULL AND "SessionAttendance"."guestCount" IS NOT NULL AND "SessionAttendance"."guestCount" >= 0)))
);
--> statement-breakpoint
CREATE TABLE "NfcTag" (
	"tagId" uuid PRIMARY KEY NOT NULL,
	"ownerUserId" uuid NOT NULL,
	"universityId" uuid NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"registeredAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_SessionID_AttendanceSession_SessionID_fk" FOREIGN KEY ("SessionID") REFERENCES "public"."AttendanceSession"("SessionID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "NfcTag" ADD CONSTRAINT "NfcTag_ownerUserId_user_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "NfcTag" ADD CONSTRAINT "NfcTag_universityId_University_UniversityID_fk" FOREIGN KEY ("universityId") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_session_event_start_unique" ON "AttendanceSession" USING btree ("eventID","scheduledStartAt");--> statement-breakpoint
CREATE UNIQUE INDEX "session_attendance_session_user_unique" ON "SessionAttendance" USING btree ("SessionID","UserID") WHERE "SessionAttendance"."UserID" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "session_attendance_session_aggregate_unique" ON "SessionAttendance" USING btree ("SessionID") WHERE "SessionAttendance"."UserID" IS NULL;--> statement-breakpoint
CREATE INDEX "session_attendance_user_idx" ON "SessionAttendance" USING btree ("UserID");--> statement-breakpoint
CREATE INDEX "session_attendance_session_idx" ON "SessionAttendance" USING btree ("SessionID");--> statement-breakpoint
CREATE UNIQUE INDEX "nfc_tag_owner_unique" ON "NfcTag" USING btree ("ownerUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "nfc_tag_token_hash_unique" ON "NfcTag" USING btree ("tokenHash");