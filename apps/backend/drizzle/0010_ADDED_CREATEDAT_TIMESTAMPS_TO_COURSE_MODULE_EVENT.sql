ALTER TABLE "Event" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Modules" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;