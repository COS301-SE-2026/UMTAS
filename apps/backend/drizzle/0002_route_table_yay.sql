--> statement-breakpoint
CREATE TABLE "Route" (
	"RouteID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UniversityID" uuid NOT NULL,
	"OriginBuildingID" uuid NOT NULL,
	"DestinationBuildingID" uuid NOT NULL,
	"PathCoordinates" jsonb NOT NULL,
	"DistanceMetres" integer NOT NULL,
	"DisplayColour" varchar(10) DEFAULT '#0000FF' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Route" ADD CONSTRAINT "Route_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Route" ADD CONSTRAINT "Route_OriginBuildingID_Building_BuildingID_fk" FOREIGN KEY ("OriginBuildingID") REFERENCES "public"."Building"("BuildingID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Route" ADD CONSTRAINT "Route_DestinationBuildingID_Building_BuildingID_fk" FOREIGN KEY ("DestinationBuildingID") REFERENCES "public"."Building"("BuildingID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "route_origin_destination_unique" ON "Route" USING btree ("OriginBuildingID","DestinationBuildingID");--> statement-breakpoint
CREATE INDEX "route_university_id_idx" ON "Route" USING btree ("UniversityID");--> statement-breakpoint