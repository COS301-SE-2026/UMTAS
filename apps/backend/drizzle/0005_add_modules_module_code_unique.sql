CREATE UNIQUE INDEX IF NOT EXISTS "modules_module_code_unique" ON "Modules" USING btree ("moduleCode");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "group_modules_group_module_unique" ON "GroupModules" USING btree ("GroupID","ModuleID");--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "ImportKey" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_import_key_unique" ON "Event" USING btree ("ImportKey");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "university_event_module_event_unique" ON "UniversityEvent" USING btree ("moduleID","eventID");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "venue_university_name_unique" ON "Venue" USING btree ("UniversityID","VenueName");
