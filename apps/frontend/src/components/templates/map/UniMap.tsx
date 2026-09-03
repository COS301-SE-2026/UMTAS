"use client";
import { useState } from "react";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapScreen } from "@/components/organisms/map/MapScreen";
import { useShapeCreator } from "@/hooks/useShapeCreator";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { getAllBuildingsQ } from "../../../../utilities/building/buildingQueries";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/atoms/baseShadcn/sheet";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import { AdminDrawControls } from "@/components/organisms/map/AdminDrawControls";
import { RouteLine } from "@/components/organisms/map/RouteLine";
import { getActiveRouteQ } from "../../../../utilities/route/routeQueries";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

function BuildingFootprint({ building }: { building: BuildingType }) {
  const footprint = building.footprint as GeoJsonPolygon | null;

  const polygon = footprint?.coordinates?.[0];

  const path = Array.isArray(polygon)
    ? polygon
        .filter((coord) => Array.isArray(coord) && coord.length >= 2)
        .map(([lng, lat]) => ({ lat, lng }))
    : undefined;

  const colour = building.displayColour || "blue";

  useShapeCreator("polygon", {
    polygon:
      path && path.length >= 3
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

export function UniMap() {
  const { university, isLoading } = useUniversityState();
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(
    null,
  );
  const [adminMode, setAdminMode] = useState<"none" | "draw" | "pin">("none");
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  //this needs to be in a very specific format. Looks super complicated, but the backend cries when I don't send the request in this format
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  const { data: buildings = [] } = useQuery({
    ...getAllBuildingsQ(),
    enabled: !isLoading && university != null,
  });
  //console.log("active route query:", { selectedDate, selectedTime });
  const { data: activeRoute } = useQuery({
    ...getActiveRouteQ({ date: selectedDate, time: selectedTime }),
    enabled: !isLoading && university != null,
  });
  const role = university?.role;
  const isAssignedRole = role != null;

  const canUserDraw = role === "UNIVERSITY_ADMIN";

  //new system for admins so that they don't do multiple things with one click
  function handleMarkerClick(building: BuildingType) {
    if (adminMode != "none") {
      return;
    }
    setSelectedBuilding(building);
  }

  if (isLoading) return <UniversityStateLoading />;

  if (!isAssignedRole) {
    return <NoRoleSelected />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-base)] mx-4 gap-4">
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="text-sm"
        />
        {activeRoute?.status === "NONE" && (
          <span className="text-sm text-[var(--text-secondary)]">
            Select a Time and Date. All Attending Events From Your Schedule Will
            Display Routes Between Your Events On The Map.
          </span>
        )}
        {activeRoute?.status === "AT_VENUE" && (
          <span className="text-sm text-[var(--text-secondary)]">
            At {activeRoute.fromEventName}
          </span>
        )}
        {activeRoute?.status === "MOVING" && (
          <span className="text-sm text-[var(--text-secondary)]">
            Walking from {activeRoute.fromEventName} to{" "}
            {activeRoute.toEventName}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <MapScreen onRequestMapSetup={() => router.push("/mapping/config")}>
          {buildings.map((building) => (
            <div key={building.buildingId}>
              {building.location && (
                <AdvancedMarker
                  position={building.location}
                  title={building.buildingName}
                  onClick={() => handleMarkerClick(building)}
                >
                  <Pin
                    background={
                      building.buildingId === activeRoute?.currentBuildingId
                        ? "var(--success-text)"
                        : building.displayColour || "var(--btn-primary-bg)"
                    }
                    scale={building.venueCount === 0 ? 0.85 : 1}
                  />
                </AdvancedMarker>
              )}
              {building.footprint && <BuildingFootprint building={building} />}
            </div>
          ))}
          {/* Ugly as can be, fix this */}
          {activeRoute?.status === "MOVING" && activeRoute.route && (
            <RouteLine
              path={
                activeRoute.route.pathCoordinates as unknown as {
                  lat: number;
                  lng: number;
                }[]
              }
              colour={activeRoute.route.displayColour}
            />
          )}
        </MapScreen>
      </div>
      {canUserDraw && (
        <AdminDrawControls buildings={buildings} onModeChange={setAdminMode} />
      )}

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
