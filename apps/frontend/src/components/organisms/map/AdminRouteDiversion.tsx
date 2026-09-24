"use client";

import { useState } from "react";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRouteQ } from "../../../../utilities/route/routeQueries";
import { divertRouteMut } from "../../../../utilities/route/routeAdminQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Slider } from "@/components/atoms/baseShadcn/slider";

const ALTERNATE_ROUTE_INDEXES = [1, 2];

export function AdminRouteDiversion({
  buildings,
}: {
  buildings: BuildingType[];
}) {
  const [originBuildingId, setOriginBuildingId] = useState("");
  const [destinationBuildingId, setDestinationBuildingId] = useState("");
  const [toIndex, setToIndex] = useState(1);
  const [diversion, setDiversion] = useState(50);

  const hasRoute = !!originBuildingId && !!destinationBuildingId;

  const { data: fromRoute } = useQuery({
    ...getRouteQ({ originBuildingId, destinationBuildingId }),
    enabled: hasRoute,
  });

  const { mutate, isPending, isSuccess, isError, reset } =
    useMutation(divertRouteMut());

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
        <Select value={originBuildingId} onValueChange={setOriginBuildingId}>
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
          onValueChange={setDestinationBuildingId}
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

      {hasRoute && (
        <>
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
                  {ALTERNATE_ROUTE_INDEXES.map((index) => (
                    <SelectItem key={index} value={String(index)}>
                      Route option {index + 1}
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

            {isSuccess && (
              <p className="text-sm text-(--text-secondary)">Diversion saved</p>
            )}

            {isError && (
              <p className="text-sm text-(--text-secondary)">
                No viable alternative routes found between these buildings.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
