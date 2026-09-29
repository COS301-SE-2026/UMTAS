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
  createBuildingMut,
  deleteBuildingMut,
  updateBuildingMut,
} from "../../../../utilities/building/buildingQueries";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import {
  Check,
  CircleCheck,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import { Separator } from "@/components/atoms/baseShadcn/separator";

interface BuildingSheetProps {
  building: BuildingType | null;
  buildings: BuildingType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBuilding: (building: BuildingType | null) => void;
  onStartPin: (buildingId: string | null) => void;
  pendingPinLocation: { lat: number; lng: number } | null;
}

export function BuildingSheet({
  building,
  buildings,
  open,
  onOpenChange,
  onSelectBuilding,
  onStartPin,
  pendingPinLocation,
}: BuildingSheetProps) {
  //building stuff
  const [buildingName, setBuildingName] = useState("");
  //const [buildingColour, setBuildingColour] = useState("#0000FF");
  const [isDeleteBuildingOpen, setIsDeleteBuildingOpen] = useState(false);
  const DEFAULT_BUILDING_COLOUR = "#0000FF";

  //create building state
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingIcon, setNewBuildingIcon] = useState("");
  //const [newBuildingColour, setNewBuildingColour] = useState("blue");
  const [duplicateError, setDuplicateError] = useState(false);

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
    //setBuildingColour(building.displayColour || "#0000FF");
  }

  const { data: venues = [] } = useQuery({
    ...getAllVenuesQ({ buildingId: building?.BuildingID }),
    enabled: !!building,
  });

  const { mutate: createBuilding, isPending: creatingBuilding } =
    useMutation(createBuildingMut());

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

  function resetNewBuilding() {
    setNewBuildingName("");
    setNewBuildingIcon("");
    //setNewBuildingColour("blue");
    setDuplicateError(false);
  }

  function handleCreateBuilding(event: React.FormEvent) {
    event.preventDefault();
    setDuplicateError(false);

    createBuilding(
      {
        body: {
          BuildingName: newBuildingName,
          icon: newBuildingIcon || null,
          displayColour: DEFAULT_BUILDING_COLOUR,
          ...(pendingPinLocation ? { location: pendingPinLocation } : {}),
        },
      },
      {
        onSuccess: () => {
          resetNewBuilding();
          onOpenChange(false);
        },
        onError: (error) => {
          //building with same name exists vro
          if ((error as { status?: number })?.status === 409) {
            setDuplicateError(true);
          }
        },
      },
    );
  }

  const hasChanges = building && buildingName !== building.BuildingName;

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
          onSelectBuilding(null);
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
          className="w-[340px] sm:w-[420px] flex flex-col justify-between p-6 bg-bg-surface"
        >
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <SheetHeader className="text-left">
              <SheetTitle className="text-lg">
                {building ? (
                  <div className="flex items-center gap-2">
                    {building.BuildingName}
                    <Badge variant="secondary">{venues.length} venues</Badge>
                  </div>
                ) : (
                  "Create Building"
                )}
              </SheetTitle>
              <SheetDescription>
                {building
                  ? "Update building details, pin location, and manage assigned venues."
                  : "Create a new campus building and drop a pin on the map."}
              </SheetDescription>
            </SheetHeader>

            <Separator />

            <div className="flex flex-col gap-1">
              <Label className="text-sm">Select building to map</Label>
              <Select
                value={building?.BuildingID ?? "new"}
                onValueChange={(val) => {
                  if (val === "new") {
                    onSelectBuilding(null);
                  } else {
                    const found = buildings.find((b) => b.BuildingID === val);
                    if (found) onSelectBuilding(found);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-bg-base">
                  <SelectValue placeholder="Choose a building to map" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Building</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.BuildingID} value={b.BuildingID}>
                      {b.BuildingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!building ? (
              <form
                onSubmit={handleCreateBuilding}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor="create-building-name" className="text-sm">
                    Building name
                  </Label>
                  <Input
                    id="create-building-name"
                    value={newBuildingName}
                    onChange={(event) => {
                      setNewBuildingName(event.target.value);
                      setDuplicateError(false);
                    }}
                    placeholder="e.g. Thuto"
                    required={true}
                    maxLength={100}
                    className="bg-bg-base"
                  />
                  {duplicateError && (
                    <p className="text-sm text-[var(--error-text)]">
                      A building named &quot;{newBuildingName}&quot; already
                      exists.
                    </p>
                  )}
                </div>

                {/* <div className="flex flex-col gap-2">
                  <Label htmlFor="building-icon">Icon (optional)</Label>
                  <Input
                    id="building-icon"
                    value={newBuildingIcon}
                    onChange={(event) => setNewBuildingIcon(event.target.value)}
                    placeholder="e.g. icon"
                  />
                </div> */}

                {/* <div className="flex flex-col gap-1">
                  <Label htmlFor="create-building-colour" className="text-sm">
                    Display colour
                  </Label>
                  <Input
                    id="create-building-colour"
                    type="color"
                    value={newBuildingColour}
                    onChange={(event) =>
                      setNewBuildingColour(event.target.value)
                    }
                    className="bg-bg-base"
                  />
                </div> */}

                <div className="flex flex-col gap-1">
                  <Label className="text-sm">Pin Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer w-fit"
                    onClick={() => {
                      onOpenChange(false);
                      onStartPin(null);
                    }}
                  >
                    <MapPin size={14} strokeWidth={1.5} />
                    {pendingPinLocation ? "Change Pin Location" : "Drop Pin"}
                  </Button>
                  {pendingPinLocation && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Pin placed ({pendingPinLocation.lat.toFixed(5)},{" "}
                      {pendingPinLocation.lng.toFixed(5)})
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={creatingBuilding || !newBuildingName.trim()}
                  className="w-full gap-2 cursor-pointer"
                >
                  <Plus size={14} strokeWidth={1} />
                  {creatingBuilding ? "Creating..." : "Create Building"}
                </Button>
              </form>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <Label className="text-base font-semibold">
                    Edit Details
                  </Label>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm">Building Name</Label>
                    <Input
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      maxLength={100}
                      className="bg-bg-base"
                    />
                  </div>
                  {/* <div className="flex flex-col gap-1">
                    <Label className="text-sm">Building Colour</Label>
                    <Input
                      type="color"
                      value={buildingColour}
                      onChange={(e) => setBuildingColour(e.target.value)}
                      maxLength={100}
                      className="bg-bg-base"
                    />
                  </div> */}

                  <div className="flex flex-col gap-1">
                    <Label className="text-sm">Location Pin</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 cursor-pointer w-fit"
                      onClick={() => {
                        onOpenChange(false);
                        onStartPin(building.BuildingID);
                      }}
                    >
                      <MapPin size={14} strokeWidth={1.5} />
                      {building.location ? "Change Pin" : "Drop Pin"}
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      onClick={handleSaveBuilding}
                      disabled={!hasChanges || savingBuilding}
                      className="cursor-pointer"
                    >
                      <CircleCheck />
                      {savingBuilding ? "Saving.." : "Save"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteBuildingOpen(true)}
                      className="cursor-pointer"
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <Label className="text-base font-semibold">Venues</Label>

                  {venues.map((venue) => (
                    <div
                      className="flex flex-col gap-2 p-2 border-t-1"
                      key={venue.VenueID}
                    >
                      {editingVenueId === venue.VenueID ? (
                        <>
                          <Input
                            value={venueTempName}
                            placeholder="Venue Name"
                            maxLength={50}
                            onChange={(e) => setVenueTempName(e.target.value)}
                            className="bg-bg-base"
                          />
                          <Input
                            type="number"
                            value={venueTempCapacity}
                            placeholder="Venue Capacity"
                            onChange={(e) =>
                              setVenueTempCapacity(Number(e.target.value))
                            }
                            className="bg-bg-base"
                          />
                          <Select
                            value={venueTempBuildingId}
                            onValueChange={setVenueTempBuildingId}
                          >
                            <SelectTrigger className="bg-bg-base">
                              <SelectValue placeholder="Building" />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings.map((b) => (
                                <SelectItem
                                  key={b.BuildingID}
                                  value={b.BuildingID}
                                >
                                  {b.BuildingName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleSaveVenue(venue)}
                              disabled={updatingVenue}
                              className="cursor-pointer"
                            >
                              <Check />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setEditingVenueId(null)}
                              className="cursor-pointer"
                            >
                              <X />
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-(--text-primary)">
                              {venue.VenueName}
                            </p>
                            <p className="text-xs text-(--text-primary)">
                              <strong>Cap:</strong> {venue.Capacity}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => startEditingVenue(venue)}
                              className="cursor-pointer"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => setVenueToDelete(venue.VenueID)}
                              className="cursor-pointer"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex flex-col items-start gap-2 border-t-1 pt-4">
                    <Label className="text-sm font-semibold">
                      Add New Venue
                    </Label>
                    <Input
                      value={newVenueName}
                      maxLength={50}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      placeholder="New Venue Name"
                      className="bg-bg-base"
                    />
                    <Input
                      type="number"
                      value={newVenueCapacity}
                      min={0}
                      onChange={(e) =>
                        setNewVenueCapacity(Number(e.target.value))
                      }
                      placeholder="New Venue Capacity"
                      className="bg-bg-base"
                    />
                    <Button
                      onClick={handleAddVenue}
                      disabled={creatingVenue || !newVenueName.trim()}
                      variant="default"
                    >
                      <Plus />
                      Add Venue
                    </Button>
                  </div>
                </div>
              </>
            )}
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
