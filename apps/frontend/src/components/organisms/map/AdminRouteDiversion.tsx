"use client";

import { useEffect, useState } from "react";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  divertRouteMut,
  getRouteVariantQ,
} from "../../../../utilities/route/routeAdminQueries";
import { getRouteQ } from "../../../../utilities/route/routeQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Slider } from "@/components/atoms/baseShadcn/slider";

export function AdminRouteDiversion({
  buildings,
}: {
  buildings: BuildingType[];
}) {
  const [originBuildingId, setOriginBuildingId] = useState("");
  const [destinationBuildingId, setDestinationBuildingId] = useState("");
  const [toIndex, setToIndex] = useState(1);
  const [diversion, setDiversion] = useState(50);

  //needs 2 buildings, otherwise no queries
  const hasRoute =
    !!originBuildingId &&
    !!destinationBuildingId &&
    originBuildingId !== destinationBuildingId;

  const { data: fromRoute, isError: fromRouteError } = useQuery({
    ...getRouteQ({ originBuildingId, destinationBuildingId }),
    enabled: hasRoute,
  });

  const query1 = useQuery({
    ...getRouteVariantQ({
      originBuildingId,
      destinationBuildingId,
      routeIndex: 1,
    }),
    enabled: hasRoute,
  });

  const query2 = useQuery({
    ...getRouteVariantQ({
      originBuildingId,
      destinationBuildingId,
      routeIndex: 2,
    }),
    enabled: hasRoute,
  });

  //keeps variants that came back and that actually have distances
  const availableVariants = [
    query1.data && typeof query1.data.distanceMetres === "number"
      ? { index: 1, route: query1.data }
      : null,
    query2.data && typeof query2.data.distanceMetres === "number"
      ? { index: 2, route: query2.data }
      : null,
  ].filter(
    (
      value,
    ): value is { index: number; route: NonNullable<typeof query1.data> } =>
      value !== null,
  );

  const isChecking = hasRoute && (query1.isFetching || query2.isFetching);
  const hasAlternatives = availableVariants.length > 0;

  useEffect(() => {
    if (
      availableVariants.length > 0 &&
      !availableVariants.some((v) => v.index === toIndex)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToIndex(availableVariants[0].index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query1.data, query2.data]);

  const {
    mutate,
    isPending,
    isSuccess,
    isError,
    data: diversionResult,
    reset,
  } = useMutation(divertRouteMut());

  function handleSubmit() {
    if (!fromRoute) {
      return;
    }

    mutate({
      body: {
        fromRoute: fromRoute.routeId,
        toRouteIndex: toIndex,
        diversion: diversion / 100,
      },
    });
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-(--border) bg-(--bg-surface)">
      <p className="text-sm">Reroute traffic between buildings</p>
      <div className="flex gap-2">
        <Select
          value={originBuildingId}
          onValueChange={(value) => {
            setOriginBuildingId(value);
            reset();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="From building" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.BuildingID} value={building.BuildingID}>
                {building.BuildingName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={destinationBuildingId}
          onValueChange={(value) => {
            setDestinationBuildingId(value);
            reset();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="To building" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.BuildingID} value={building.BuildingID}>
                {building.BuildingName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {originBuildingId &&
        destinationBuildingId &&
        originBuildingId === destinationBuildingId && (
          <p className="text-sm text-(--text-secondary)">
            Choose two different buildings.
          </p>
        )}

      {hasRoute && fromRouteError && (
        <p className="text-sm text-(--text-secondary)">
          No route exists between these buildings yet.
        </p>
      )}

      {hasRoute && !fromRouteError && !isChecking && !hasAlternatives && (
        <p className="text-sm text-(--text-secondary)">
          No viable alternative routes found between these buildings.
        </p>
      )}

      {hasRoute && !fromRouteError && hasAlternatives && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-(--text-secondary)">
            Diverting from original route{" "}
            {fromRoute ? `(${fromRoute.distanceMetres}m)` : ""}
          </p>

          <div className="flex flex-col gap-2">
            <Label>Divert to Route</Label>
            <Select
              value={String(toIndex)}
              onValueChange={(value) => {
                setToIndex(Number(value));
                reset();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableVariants.map(({ index, route }) => (
                  <SelectItem key={index} value={String(index)}>
                    Route {index}: {route.distanceMetres} metres
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Diversion percentage ({diversion}%)</Label>
            <Slider
              min={0}
              max={100}
              value={[diversion]}
              onValueChange={(values) => setDiversion(values[0])}
              className="w-100"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending || !fromRoute}
            className="w-fit"
          >
            {isPending ? "Saving.." : "Set Diversion"}
          </Button>

          {isSuccess && diversionResult && (
            <p className="text-sm text-(--text-secondary)">
              New route with distance {diversionResult.toRoute.distanceMetres}m
              was chosen as the diversion.
            </p>
          )}

          {isError && (
            <p className="text-sm text-(--text-secondary)">
              Something went wrong setting the diversion.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
