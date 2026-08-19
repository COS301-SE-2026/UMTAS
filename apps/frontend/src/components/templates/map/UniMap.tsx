"use client";
import { useState } from "react";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapScreen } from "@/components/organisms/map/MapScreen";
import { useShapeCreator } from "@/hooks/useShapeCreator";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { UserDetails } from "@/lib/userclass/userClass";
import { getAllBuildingsQ } from "../../../../utilities/building/buildingQueries";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/atoms/baseShadcn/sheet";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";

//do you need to run api gen after making it an export in backend??
interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

//passed down so that google maps does not cry (happens more often than you would think)
interface UniMapProps {
  apiKey: string;
}

//the actual outline for the buildings
function BuildingFootprint({ building }: { building: BuildingType }) {
  const footprint = building.footprint as GeoJsonPolygon | null;
  const path = footprint?.coordinates?.[0]?.map(([lng, lat]) => ({ lat, lng }));
  const colour = building.displayColour || "blue";

  useShapeCreator("polygon", {
    polygon: path
      ? {
          paths: path,
          strokeColor: colour,
          strokeWeight: 2.5,
          fillColor: colour,
          fillOpacity: 0.2,
        }
      : undefined,
  });

  return null;
}

export function UniMap({ apiKey }: UniMapProps) {
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(
    null,
  );
  const { data: buildings = [] } = useQuery(getAllBuildingsQ());
  const hasRole = UserDetails.getUniDetails()?.role != null;

  if (!hasRole) {
    return <NoRoleSelected />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
      <div className="flex-1 overflow-hidden border border-[var(--border)] shadow-md">
        <MapScreen
          apiKey={apiKey}
          onRequestMapSetup={() => router.push("/mapping/config")}
        >
          {buildings.map((building) => (
            <div key={building.buildingId}>
              {building.location && (
                <AdvancedMarker
                  position={building.location}
                  title={building.buildingName}
                  onClick={() => setSelectedBuilding(building)}
                >
                  <Pin
                    background={
                      building.displayColour || "var(--btn-primary-bg)"
                    }
                    scale={building.venueCount === 0 ? 0.85 : 1}
                  />
                </AdvancedMarker>
              )}
              {building.footprint && <BuildingFootprint building={building} />}
            </div>
          ))}
        </MapScreen>
      </div>

      <Sheet
        open={!!selectedBuilding}
        onOpenChange={(open) => !open && setSelectedBuilding(null)}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedBuilding?.buildingName}
              <Badge variant="secondary">
                {selectedBuilding?.venueCount ?? 0} venues
              </Badge>
            </SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}
