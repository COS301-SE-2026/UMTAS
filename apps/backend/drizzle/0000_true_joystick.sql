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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "Event" (
	"userID" uuid NOT NULL,
	"eventID" serial PRIMARY KEY NOT NULL,
	"eventCriteria" jsonb,
	"isRecurring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EventsToTimetables" (
	"eventID" integer NOT NULL,
	"timetableID" integer NOT NULL,
	CONSTRAINT "EventsToTimetables_eventID_timetableID_pk" PRIMARY KEY("eventID","timetableID")
);
--> statement-breakpoint
CREATE TABLE "Timetable" (
	"timetableID" serial PRIMARY KEY NOT NULL,
	"timetableName" varchar(32),
	"userID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LectureEv" (
	"lectureID" serial PRIMARY KEY NOT NULL,
	"moduleID" integer,
	"eventID" integer,
	"venue" varchar(30)
);
--> statement-breakpoint
CREATE TABLE "Modules" (
	"moduleID" serial PRIMARY KEY NOT NULL,
	"moduleCode" varchar(10) NOT NULL,
	"moduleName" varchar(256) NOT NULL,
	"moduleDescription" text,
	"styling" varchar(32),
	"userID" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventsToTimetables" ADD CONSTRAINT "EventsToTimetables_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventsToTimetables" ADD CONSTRAINT "EventsToTimetables_timetableID_Timetable_timetableID_fk" FOREIGN KEY ("timetableID") REFERENCES "public"."Timetable"("timetableID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LectureEv" ADD CONSTRAINT "LectureEv_moduleID_Modules_moduleID_fk" FOREIGN KEY ("moduleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LectureEv" ADD CONSTRAINT "LectureEv_eventID_Event_eventID_fk" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("eventID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_key_unique" ON "rateLimit" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expiresAt");