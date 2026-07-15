ALTER TABLE "Course" DROP CONSTRAINT "Course_GroupID_ModuleGrouping_GroupID_fk";
--> statement-breakpoint
ALTER TABLE "Course" ALTER COLUMN "GroupID" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ModuleGrouping" ADD COLUMN "hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_GroupID_ModuleGrouping_GroupID_fk" FOREIGN KEY ("GroupID") REFERENCES "public"."ModuleGrouping"("GroupID") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModuleGrouping" DROP COLUMN "GroupName";--> statement-breakpoint
ALTER TABLE "ModuleGrouping" ADD CONSTRAINT "ModuleGrouping_hash_unique" UNIQUE("hash");