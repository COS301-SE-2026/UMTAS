DROP INDEX "route_origin_destination_unique";--> statement-breakpoint
DROP INDEX "route_university_id_idx";--> statement-breakpoint
ALTER TABLE "Route" ADD COLUMN "RouteIndex" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "route_university_origin_destination_variant_unique" ON "Route" USING btree ("UniversityID","OriginBuildingID","DestinationBuildingID","RouteIndex");--> statement-breakpoint
CREATE INDEX "route_university_origin_destination_idx" ON "Route" USING btree ("UniversityID","OriginBuildingID","DestinationBuildingID");