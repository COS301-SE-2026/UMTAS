"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentRoutesQ } from "../../../../utilities/route/studentRoutingQueries";
import { getRoutingHeatmapQ } from "../../../../utilities/route/routeQueries";
import { useMemo, useState } from "react";
import { getCongestionLevel } from "../../../../utilities/heatmaps/routeCongestion";
import { RouteLine } from "./RouteLine";
import { Button } from "@/components/atoms/baseShadcn/button";
import { AlertTriangle } from "lucide-react";
import { AlternateRouteDialog } from "./AlternateRoutesDialog";

//whoever's reading this if you add more props create an interface
export function StudentRoutes({ date, time }: { date: string; time?: string }) {
  const { data: studentRoutes } = useQuery(getStudentRoutesQ({ date }));
  const { data: heatmapRoutes = [] } = useQuery(getRoutingHeatmapQ({ date }));

  //resets on reload since we are doing this in the session
  const [selectedIndex, setSelectedIndex] = useState<Record<string, number>>(
    {},
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  const buildingPairCongestion = useMemo(() => {
    const map = new Map<string, number>();

    for (const route of heatmapRoutes) {
      map.set(
        `${route.origin.buildingId}:${route.destination.buildingId}`,
        route.projected,
      );
    }

    return map;
  }, [heatmapRoutes]);

  if (!studentRoutes) {
    return null;
  }

  const visibleRoutes = time
    ? studentRoutes.routes.filter(
        (transition) =>
          time >= transition.originEvent.endTime &&
          time <= transition.destinationEvent.startTime,
      )
    : studentRoutes.routes;

  return (
    <>
      {visibleRoutes.map((transition) => {
        if (!transition.route || !transition.originEvent.buildingId) {
          return null;
        }

        const buildingPairKey = `${transition.originEvent.buildingId}:${transition.destinationEvent.buildingId}`;
        const congestionCount =
          buildingPairCongestion.get(buildingPairKey) ?? 0;
        const congestion = getCongestionLevel(congestionCount);
        const isBusy = congestion !== "low";

        return (
          <div key={buildingPairKey}>
            <RouteLine
              path={transition.route.pathCoordinates}
              colour={
                selectedIndex[buildingPairKey] !== undefined
                  ? "#3B82F6"
                  : transition.route.displayColour
              }
            />

            {isBusy && selectedIndex[buildingPairKey] === undefined && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenKey(buildingPairKey)}
              >
                <AlertTriangle />
                The route from {transition.originEvent.eventName} to{" "}
                {transition.destinationEvent.eventName} is busy, it is advised
                to take another route.
              </Button>
            )}

            <AlternateRouteDialog
              open={openKey === buildingPairKey}
              onOpenChange={(open) => !open && setOpenKey(null)}
              destinationEventId={transition.destinationEvent.eventId}
              originEventId={transition.originEvent.eventId}
              date={date}
              onSelect={(routeIndex) =>
                setSelectedIndex((previous) => ({
                  ...previous,
                  [buildingPairKey]: routeIndex,
                }))
              }
              currentCongestion={congestion}
            />
          </div>
        );
      })}
    </>
  );
}
