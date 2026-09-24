import { useQuery } from "@tanstack/react-query";
import {
  getAlternateRoutesQ,
  getStudentRoutesQ,
} from "../../../../utilities/route/studentRoutingQueries";
import { getRoutingHeatmapQ } from "../../../../utilities/route/routeQueries";
import { useMemo, useState } from "react";
import { getCongestionLevel } from "../../../../utilities/heatmaps/routeCongestion";
import { Button } from "@/components/atoms/baseShadcn/button";
import { AlertTriangle } from "lucide-react";
import { AlternateRouteDialog } from "./AlternateRoutesDialog";
import { RouteLine } from "./RouteLine";
import { getStudentRouteTransitionType } from "../../../../utilities/route/studentRoutingRequestBuilder";

export function StudentRouteAlerts({
  date,
  time,
  selectedIndex,
  setSelectedIndex,
}: {
  date: string;
  time?: string;
  selectedIndex: Record<string, number>;
  setSelectedIndex: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}) {
  const { data: studentRoutes } = useQuery(getStudentRoutesQ({ date }));
  const { data: heatmapRoutes = [] } = useQuery(getRoutingHeatmapQ({ date }));
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
            {isBusy && selectedIndex[buildingPairKey] === undefined && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenKey(buildingPairKey)}
                className="ring-1 ring-(--text-primary) animate-pulse cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" />
                Busy Route
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
              mainDistance={transition.route.distanceMetres}
            />
          </div>
        );
      })}
    </>
  );
}

function StudentRouteLineItem({
  transition,
  routeIndex,
  date,
}: {
  transition: getStudentRouteTransitionType;
  routeIndex?: number;
  date: string;
}) {
  const isAlternative = routeIndex !== undefined && routeIndex !== 0;

  const { data: alternativeRouteData } = useQuery({
    ...getAlternateRoutesQ({
      originEventId: transition.originEvent.eventId,
      destinationEventId: transition.destinationEvent.eventId,
      date,
      routeIndex: routeIndex ?? 0,
    }),
    enabled: isAlternative,
  });

  const path =
    isAlternative && alternativeRouteData?.route?.pathCoordinates
      ? alternativeRouteData.route.pathCoordinates
      : transition.route?.pathCoordinates;

  if (!path) {
    return null;
  }

  return (
    <RouteLine
      path={path}
      colour={isAlternative ? "#3B82F6" : transition.route?.displayColour}
    />
  );
}

export function StudentRouteLines({
  date,
  time,
  selectedIndex,
}: {
  date: string;
  time?: string;
  selectedIndex: Record<string, number>;
}) {
  const { data: studentRoutes } = useQuery(getStudentRoutesQ({ date }));

  if (!studentRoutes) return null;

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
        if (!transition.route || !transition.originEvent.buildingId)
          return null;

        const buildingPairKey = `${transition.originEvent.buildingId}:${transition.destinationEvent.buildingId}`;

        return (
          <StudentRouteLineItem
            key={buildingPairKey}
            transition={transition}
            routeIndex={selectedIndex[buildingPairKey]}
            date={date}
          />
        );
      })}
    </>
  );
}
