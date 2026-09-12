import { useState } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { CustomiseEventCard } from "@/components/molecules/customise/CustomiseEventCard";
import {
  EventResponse,
  EventCriteria,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  updateEventMut,
  updateEventVenueMut,
} from "@/components/templates/builder/Queries/eventQueries";
import { getAllBuildingsQ } from "../../../../utilities/building/buildingQueries";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onViewModeChange?: (tab: "Modules" | "Events") => void;
}

export default function EventsShell({
  events,
  modules,
  onViewModeChange,
}: CustomiseShellProps) {
  const { data: buildingsList } = useQuery(getAllBuildingsQ());
  const buildings = buildingsList ?? [];

  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.eventId,
  );

  //mostly same logic copy and pasted from modules shell
  const savedEvent =
    events.find((e) => e.eventId === selectedEventId) || events[0];

  //this keeps track of what has been changed
  const [tempEvent, setTempEvent] = useState<EventResponse>(savedEvent);

  //when saved set to temp
  const [prevSavedEvent, setPrevSavedEvent] = useState(savedEvent);

  if (savedEvent !== prevSavedEvent) {
    setPrevSavedEvent(savedEvent);
    setTempEvent(savedEvent);
  }

  // Mutations
  const { mutate: saveEvent, isPending: isSavingEvent } =
    useMutation(updateEventMut());
  const { mutate: updateEventVenue, isPending: isSavingVenue } = useMutation(
    updateEventVenueMut(),
  );

  const isSaving = isSavingEvent || isSavingVenue;

  //bool check if the event actually changed
  const didEventChange =
    !!tempEvent &&
    !!savedEvent &&
    JSON.stringify(tempEvent) !== JSON.stringify(savedEvent);

  if (!tempEvent) {
    return null;
  }

  //updates event object
  function handleUpdate(
    id: string,
    field: keyof EventResponse | keyof EventCriteria | "buildingId",
    value: string | boolean | string[],
  ) {
    setTempEvent((prev) => {
      if (!prev) {
        return prev;
      }

      const insideEventObject = field in prev;

      if (insideEventObject) {
        return {
          ...prev,
          [field]: value,
        };
      }

      return {
        ...prev,
        eventCriteria: {
          ...prev.eventCriteria,
          [field]: value,
        },
      };
    });
  }

  function handleSave() {
    if (!tempEvent) return;

    const thisEventCriteria = {
      ...tempEvent.eventCriteria,
    } as EventCriteria & {
      buildingId?: string;
    };

    const selectedBuildingId = thisEventCriteria.buildingId;
    delete thisEventCriteria.buildingId;

    const selectedVenueName =
      typeof tempEvent.venues?.[0] === "string"
        ? tempEvent.venues[0]
        : tempEvent.venues?.[0]?.venueName;

    if (selectedVenueName?.trim()) {
      updateEventVenue({
        path: { id: tempEvent.eventId },
        body: {
          venueName: selectedVenueName.trim(),
          buildingId: selectedBuildingId || undefined,
        },
      });
    }

    saveEvent({
      path: { id: tempEvent.eventId },
      body: {
        eventName: tempEvent.eventName,
        activityCode: tempEvent.activityCode,
        eventCriteria: thisEventCriteria,
        isRecurring: tempEvent.isRecurring,
      },
    });
  }

  function handleDiscard() {
    setTempEvent(savedEvent);
  }

  //link the module code with the event
  function getLinkedModuleName(
    event: EventResponse,
    modules: ModuleResponseDto[],
  ) {
    const found = modules.find(
      (module) => module.moduleID === event.eventCriteria?.moduleId,
    );
    if (!found) {
      return null;
    }
    return found.moduleCode;
  }

  return (
    <Card className="w-fit m-6 p-4">
      <div className="flex flex-row gap-6">
        <div className="flex flex-col gap-2 min-w-[240px]">
          <div className="flex gap-1 bg-muted p-1 rounded-md mb-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs flex-1 font-semibold"
            >
              Events
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs flex-1 text-muted-foreground"
              onClick={() => onViewModeChange?.("Modules")}
            >
              Modules
            </Button>
          </div>

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {events.map((event) => (
              <CustomiseEventPanel
                event={event}
                modules={modules}
                key={event.eventId}
                onClick={() => setSelectedEventId(event.eventId)}
              />
            ))}
          </div>
        </div>

        <div className="w-[1px] bg-border self-stretch" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b min-w-[320px]">
            <span className="text-sm font-semibold">
              {tempEvent.eventName}
              {" | "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {getLinkedModuleName(tempEvent, modules) || "No Module Linked"}
              </span>
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                disabled={!didEventChange || isSaving}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs"
                disabled={!didEventChange}
                onClick={handleDiscard}
              >
                Discard
              </Button>
            </div>
          </div>

          <CustomiseEventCard
            event={tempEvent}
            modules={modules}
            buildings={buildings}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </Card>
  );
}
