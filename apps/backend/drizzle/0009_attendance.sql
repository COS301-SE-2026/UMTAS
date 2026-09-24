ALTER TABLE "SessionAttendance" ALTER COLUMN "captureMethod" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."SessionAttendanceCaptureMethod";--> statement-breakpoint
CREATE TYPE "public"."SessionAttendanceCaptureMethod" AS ENUM('NFC', 'BARCODE', 'MANUAL');--> statement-breakpoint
ALTER TABLE "SessionAttendance" ALTER COLUMN "captureMethod" SET DATA TYPE "public"."SessionAttendanceCaptureMethod" USING "captureMethod"::"public"."SessionAttendanceCaptureMethod";--> statement-breakpoint
DROP INDEX "session_attendance_session_aggregate_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "session_attendance_session_aggregate_unique" ON "SessionAttendance" USING btree ("SessionID","captureMethod") WHERE "SessionAttendance"."UserID" IS NULL;