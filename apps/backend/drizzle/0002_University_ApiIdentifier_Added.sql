ALTER TABLE "University" ADD COLUMN "ApiIdentifier" varchar(10);--> statement-breakpoint
ALTER TABLE "University" ADD CONSTRAINT "University_ApiIdentifier_unique" UNIQUE("ApiIdentifier");