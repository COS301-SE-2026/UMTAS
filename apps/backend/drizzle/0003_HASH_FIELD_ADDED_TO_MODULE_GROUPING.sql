ALTER TABLE "ModuleGrouping" DROP CONSTRAINT "ModuleGrouping_hash_unique";--> statement-breakpoint
ALTER TABLE "ModuleGrouping" ADD COLUMN "Hash" varchar(64);--> statement-breakpoint
ALTER TABLE "ModuleGrouping" DROP COLUMN "hash";--> statement-breakpoint
ALTER TABLE "ModuleGrouping" ADD CONSTRAINT "ModuleGrouping_Hash_unique" UNIQUE("Hash");