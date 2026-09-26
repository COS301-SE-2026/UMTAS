CREATE TABLE "VisionSession" (
	"SessionID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ModuleID" uuid NOT NULL,
	"EventID" uuid,
	"Date" date NOT NULL,
	"SessionName" varchar(256) NOT NULL,
	"SessionDsc" text,
	"Data" jsonb DEFAULT '{"questions_asked":0,"total_restless_frames":0,"total_stable_frames":0,"total_paying_attention":0,"total_no_attention":0,"total_frames":0}'::jsonb NOT NULL,
	"CreatedBy" uuid,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "VisionSession" ADD CONSTRAINT "VisionSession_ModuleID_Modules_moduleID_fk" FOREIGN KEY ("ModuleID") REFERENCES "public"."Modules"("moduleID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "VisionSession" ADD CONSTRAINT "VisionSession_EventID_Event_eventID_fk" FOREIGN KEY ("EventID") REFERENCES "public"."Event"("eventID") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "VisionSession" ADD CONSTRAINT "VisionSession_CreatedBy_user_id_fk" FOREIGN KEY ("CreatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vision_session_module_date_idx" ON "VisionSession" USING btree ("ModuleID","Date");--> statement-breakpoint
CREATE INDEX "vision_session_event_idx" ON "VisionSession" USING btree ("EventID");--> statement-breakpoint
CREATE UNIQUE INDEX "vision_session_module_name_unique" ON "VisionSession" USING btree ("ModuleID","SessionName","Date");