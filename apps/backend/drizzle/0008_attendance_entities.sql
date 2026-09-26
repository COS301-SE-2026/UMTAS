CREATE TABLE "AttendanceOperatorPreference" (
	"ownerUserId" uuid NOT NULL,
	"universityId" uuid NOT NULL,
	"preferredEventId" uuid NOT NULL,
	"selectedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_operator_preference_pk" PRIMARY KEY("ownerUserId","universityId")
);
--> statement-breakpoint
ALTER TABLE "AttendanceOperatorPreference" ADD CONSTRAINT "AttendanceOperatorPreference_ownerUserId_user_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AttendanceOperatorPreference" ADD CONSTRAINT "AttendanceOperatorPreference_universityId_University_UniversityID_fk" FOREIGN KEY ("universityId") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AttendanceOperatorPreference" ADD CONSTRAINT "AttendanceOperatorPreference_preferredEventId_Event_eventID_fk" FOREIGN KEY ("preferredEventId") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;