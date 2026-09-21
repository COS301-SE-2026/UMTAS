"use client";

import { useEffect, useState } from "react";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createVenueMut,
  deleteVenueMut,
  getAllVenuesQ,
  updateVenueMut,
} from "../../../../utilities/venue/venueQueries";
import {
  deleteBuildingMut,
  updateBuildingMut,
} from "../../../../utilities/building/buildingQueries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/atoms/baseShadcn/sheet";
import {
  BaseVenueDto,
  UpdateVenueDto,
} from "../../../../utilities/venue/venueRequestBuilder";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/customise/alert-dialog-customise";

interface BuildingSheetProps {
  building: BuildingType | null;
  buildings: BuildingType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuildingSheet({
  building,
  buildings,
  open,
  onOpenChange,
}: BuildingSheetProps) {
  //building stuff
  const [buildingName, setBuildingName] = useState("");
  const [buildingColour, setBuildingColour] = useState("#0000FF");
  const [isDeleteBuildingOpen, setIsDeleteBuildingOpen] = useState(false);

  //venue stuff
  //updating venues
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [venueTempName, setVenueTempName] = useState("");
  const [venueTempCapacity, setVenueTempCapacity] = useState(0);
  const [venueTempBuildingId, setVenueTempBuildingId] = useState<string>("");

  //adding new venues
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueCapacity, setNewVenueCapacity] = useState(0);

  //deleting a venue
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);

  const [prevBuildingId, setPrevBuildingId] = useState(building?.BuildingID);
  if (building && building.BuildingID !== prevBuildingId) {
    setPrevBuildingId(building.BuildingID);
    setBuildingName(building.BuildingName);
    setBuildingColour(building.displayColour || "#0000FF");
  }

  const { data: venues = [] } = useQuery({
    ...getAllVenuesQ({ buildingId: building?.BuildingID }),
    enabled: !!building,
  });

  const { mutate: saveBuilding, isPending: savingBuilding } =
    useMutation(updateBuildingMut());

  const { mutate: deleteBuilding, isPending: deletingBuilding } =
    useMutation(deleteBuildingMut());

  const { mutate: createVenue, isPending: creatingVenue } =
    useMutation(createVenueMut());

  const { mutate: updateVenue, isPending: updatingVenue } =
    useMutation(updateVenueMut());

  const { mutate: deleteVenue, isPending: deletingVenue } =
    useMutation(deleteVenueMut());

  if (!building) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" />
      </Sheet>
    );
  }

  const hasChanges =
    buildingName !== building.BuildingName ||
    buildingColour !== (building.displayColour || "#0000FF");

  function handleSaveBuilding() {
    if (!building) {
      return;
    }

    saveBuilding({
      path: { buildingId: building.BuildingID },
      body: {
        ...(buildingName !== building.BuildingName
          ? { BuildingName: buildingName }
          : {}),
        ...(buildingColour !== building.displayColour
          ? { displayColour: buildingColour }
          : {}),
      },
    });
  }

  function handleDeleteBuilding() {
    if (!building) {
      return;
    }

    deleteBuilding(
      { path: { buildingId: building.BuildingID } },
      {
        onSuccess: () => {
          setIsDeleteBuildingOpen(false);
          onOpenChange(false);
        },
      },
    );
  }

  function startEditingVenue(venue: BaseVenueDto) {
    setEditingVenueId(venue.VenueID);
    setVenueTempName(venue.VenueName);
    setVenueTempBuildingId(venue.BuildingID ?? "");
    setVenueTempCapacity(venue.Capacity);
  }

  function handleSaveVenue(venue: BaseVenueDto) {
    const body: UpdateVenueDto = {};

    if (venueTempName !== venue.VenueName) {
      body.VenueName = venueTempName;
    }

    if (venueTempCapacity !== venue.Capacity) {
      body.Capacity = venueTempCapacity;
    }

    if (venueTempBuildingId !== (venue.BuildingID ?? "")) {
      body.BuildingID = venueTempBuildingId || null;
    }

    if (Object.keys(body).length <= 0) {
      setEditingVenueId(null);
      return;
    }

    updateVenue(
      { path: { venueId: venue.VenueID }, body },
      { onSuccess: () => setEditingVenueId(null) },
    );
  }

  function handleAddVenue() {
    if (!building || !newVenueName.trim()) {
      return;
    }

    createVenue(
      {
        body: {
          VenueName: newVenueName.trim(),
          BuildingID: building.BuildingID,
          Capacity: newVenueCapacity,
        },
      },
      {
        onSuccess: () => {
          setNewVenueName("");
          setNewVenueCapacity(0);
        },
      },
    );
  }

  function handleConfirmDeleteVenue() {
    if (!venueToDelete) {
      return;
    }

    deleteVenue(
      { path: { venueId: venueToDelete } },
      { onSuccess: () => setVenueToDelete(null) },
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col gap-4 overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {building.BuildingName}
              <Badge variant="secondary">{venues.length} venues</Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-2 px-4">
            <div className="flex flex-col gap-2">
              <Label>Building Name</Label>
              <Input
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Building Colour</Label>
              <Input
                type="color"
                value={buildingColour}
                onChange={(e) => setBuildingColour(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={handleSaveBuilding}
                disabled={!hasChanges || savingBuilding}
              >
                {savingBuilding ? "Saving.." : "Save"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteBuildingOpen(true)}
              >
                <Trash2 />
                Delete Building
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pb-2 px-4">
            <p className="text-xs text-(--text-primary)">Venues</p>

            {venues.map((venue) => (
              <div
                className="flex flex-col rounded-md gap-2 border p-2 border-border"
                key={venue.VenueID}
              >
                {editingVenueId === venue.VenueID ? (
                  <>
                    <Input
                      value={venueTempName}
                      placeholder="Venue Name"
                      maxLength={50}
                      onChange={(e) => setVenueTempName(e.target.value)}
                    />
                    <Input
                      type="number"
                      value={venueTempCapacity}
                      placeholder="Venue Capacity"
                      onChange={(e) =>
                        setVenueTempCapacity(Number(e.target.value))
                      }
                    />
                    <Select
                      value={venueTempBuildingId}
                      onValueChange={setVenueTempBuildingId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Building" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem
                            key={building.BuildingID}
                            value={building.BuildingID}
                          >
                            {building.BuildingName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleSaveVenue(venue)}
                        disabled={updatingVenue}
                      >
                        <Check />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingVenueId(null)}
                      >
                        <X />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-(--text-primary)">
                          {venue.VenueName}
                        </p>
                        <p className="text-xs text-(--text-primary)">
                          {venue.Capacity}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={() => startEditingVenue(venue)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setVenueToDelete(venue.VenueID)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div className="flex flex-col rounded-lg gap-2 border border-border p-2">
              <Input
                value={newVenueName}
                maxLength={50}
                onChange={(e) => setNewVenueName(e.target.value)}
                placeholder="New Venue Name"
              />
              <Input
                type="number"
                value={newVenueCapacity}
                min={0}
                onChange={(e) => setNewVenueCapacity(Number(e.target.value))}
                placeholder="New Venue Capacity"
              />
              <Button
                onClick={handleAddVenue}
                disabled={creatingVenue || !newVenueName.trim()}
              >
                <Plus />
                Add Venue
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteBuildingOpen}
        onOpenChange={setIsDeleteBuildingOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Building?</AlertDialogTitle>
            <AlertDialogDescription>
              {venues.length > 0
                ? `This Building Still Has ${venues.length} Venue(s) Assigned. Reassign Or Delete Them First`
                : "Deleting Cannot Be Undone"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBuilding}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!venueToDelete}
        onOpenChange={(object) => !object && setVenueToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Venue?</AlertDialogTitle>
            <AlertDialogDescription>
              This Cannot Be Undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteVenue}
              variant="destructive"
              disabled={deletingVenue}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
