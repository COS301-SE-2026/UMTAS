ALTER TABLE "ModuleStyling" RENAME COLUMN "UserTimetableID" TO "UserID";--> statement-breakpoint
ALTER TABLE "ModuleStyling" DROP CONSTRAINT "ModuleStyling_UserTimetableID_UserTimetable_UserTimetableID_fk";
--> statement-breakpoint
ALTER TABLE "ModuleStyling" DROP CONSTRAINT "ModuleStyling_ModuleID_UserTimetableID_pk";--> statement-breakpoint
ALTER TABLE "ModuleStyling" ADD CONSTRAINT "ModuleStyling_ModuleID_UserID_pk" PRIMARY KEY("ModuleID","UserID");--> statement-breakpoint
ALTER TABLE "ModuleStyling" ADD CONSTRAINT "ModuleStyling_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;