ALTER TABLE "Modules" ALTER COLUMN "moduleCode" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "Modules" ALTER COLUMN "styling" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "Modules" ADD COLUMN "moduleDescription" text;