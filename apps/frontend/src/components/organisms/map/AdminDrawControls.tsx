"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Pentagon, Check, X } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useBuildingDraw } from "@/hooks/useBuildingDraw";
import { updateBuildingLocationMut } from "../../../../utilities/building/buildingQueries";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { CreateBuilding } from "@/components/organisms/map/CreateBuilding";

interface AdminDrawControlsProps {
  buildings: BuildingType[];
}

export function AdminDrawControls({ buildings }: AdminDrawControlsProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  //from my little hook(er)
  const {
    mode,
    setMode,
    pinLocation,
    polygonPath,
    reset,
    finishDrawing,
    toGeoJSON,
  } = useBuildingDraw();

  const { mutate, isPending } = useMutation(updateBuildingLocationMut());

  function handleSave() {
    if (!selectedBuildingId) {
      return;
    }

    const footprint = toGeoJSON();

    mutate(
      {
        path: { buildingId: selectedBuildingId },
        body: {
          ...(pinLocation ? { location: pinLocation } : {}),
          ...(footprint ? { footprint } : {}),
        },
      },
      {
        onSuccess: () => reset(),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-md">
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Admin: pin or outline a building
      </p>

      <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a building to map" />
        </SelectTrigger>
        <SelectContent>
          {buildings.map((building) => (
            <SelectItem key={building.buildingId} value={building.buildingId}>
              {building.buildingName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "pin" ? "default" : "outline"}
          size="sm"
          disabled={!selectedBuildingId}
          onClick={() => {
            setMode("pin");
          }}
        >
          <MapPin size={14} strokeWidth={1.5} />
          Drop pin
        </Button>

        <Button
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          disabled={!selectedBuildingId}
          onClick={() => {
            setMode("draw");
          }}
        >
          <Pentagon size={14} strokeWidth={1.5} />
          {mode === "draw"
            ? `Drawing (${polygonPath.length} points)`
            : "Draw outline"}
        </Button>

        <CreateBuilding />
      </div>

      {mode === "draw" && polygonPath.length >= 3 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={finishDrawing}
          className="w-fit"
        >
          <Check size={14} strokeWidth={1.5} />
          Finish outline
        </Button>
      )}

      {(pinLocation || polygonPath.length > 0) && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !selectedBuildingId}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <X size={12} strokeWidth={1} />
            Discard
          </Button>
        </div>
      )}
    </div>
  );
}
