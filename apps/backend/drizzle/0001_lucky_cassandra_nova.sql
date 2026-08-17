CREATE TABLE "Building" (
	"BuildingID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UniversityID" uuid NOT NULL,
	"BuildingName" varchar(100) NOT NULL,
	"Latitude" double precision,
	"Longitude" double precision,
	"Footprint" jsonb,
	"Icon" varchar(64),
	"DisplayColour" varchar(10),
	"CreatedBy" uuid,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UniversityMapConfig" (
	"UniversityID" uuid PRIMARY KEY NOT NULL,
	"NorthLat" double precision NOT NULL,
	"SouthLat" double precision NOT NULL,
	"EastLng" double precision NOT NULL,
	"WestLng" double precision NOT NULL,
	"DefaultZoom" integer DEFAULT 16 NOT NULL,
	"GoogleMapId" varchar(64)
);
--> statement-breakpoint
ALTER TABLE "Venue" ADD COLUMN "BuildingID" uuid;--> statement-breakpoint
ALTER TABLE "Building" ADD CONSTRAINT "Building_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Building" ADD CONSTRAINT "Building_CreatedBy_user_id_fk" FOREIGN KEY ("CreatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UniversityMapConfig" ADD CONSTRAINT "UniversityMapConfig_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "building_university_name_unique" ON "Building" USING btree ("UniversityID","BuildingName");--> statement-breakpoint
CREATE INDEX "building_university_id_idx" ON "Building" USING btree ("UniversityID");--> statement-breakpoint
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_BuildingID_Building_BuildingID_fk" FOREIGN KEY ("BuildingID") REFERENCES "public"."Building"("BuildingID") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venue_building_id_idx" ON "Venue" USING btree ("BuildingID");