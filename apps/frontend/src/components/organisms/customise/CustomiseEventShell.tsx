"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { ChevronDown } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return events;
    }

    const query = searchQuery.toLowerCase();

    return events.filter((event) => {
      const matchName = event.eventName?.toLowerCase().includes(query);
      const matchCode = event.activityCode?.toLowerCase().includes(query);
      const mod = modules.find(
        (module) => module.moduleID === event.eventCriteria?.moduleId,
      );
      const matchModName = mod?.moduleName?.toLowerCase().includes(query);
      const matchModCode = mod?.moduleCode?.toLowerCase().includes(query);
      return matchName || matchCode || matchModName || matchModCode;
    });
  }, [events, modules, searchQuery]);

  const savedEvent =
    events.find((e) => e.eventId === selectedEventId) || events[0];

  const [tempEvent, setTempEvent] = useState<EventResponse>(savedEvent);

  const [prevSavedEvent, setPrevSavedEvent] = useState(savedEvent);

  if (savedEvent !== prevSavedEvent) {
    setPrevSavedEvent(savedEvent);
    setTempEvent(savedEvent);
  }

  const { mutate: saveEvent, isPending: isSavingEvent } =
    useMutation(updateEventMut());
  const { mutate: updateEventVenue, isPending: isSavingVenue } = useMutation(
    updateEventVenueMut(),
  );

  const isSaving = isSavingEvent || isSavingVenue;

  const didEventChange =
    !!tempEvent &&
    !!savedEvent &&
    JSON.stringify(tempEvent) !== JSON.stringify(savedEvent);

  if (!tempEvent) {
    return null;
  }

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
    <Card className="w-[792px] h-[600px] m-6 p-4 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
        <div className="flex flex-col gap-2 w-full md:min-w-[240px] md:w-auto h-auto md:h-full flex-shrink-0">
          <div className="flex gap-1 bg-muted p-1 rounded-md mb-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs flex-1 font-semibold cursor-pointer"
            >
              Events
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs flex-1 text-muted-foreground cursor-pointer"
              onClick={() => onViewModeChange?.("Modules")}
            >
              Modules
            </Button>
          </div>

          <div className="md:hidden flex flex-row items-center gap-2 flex-shrink-0 mb-2">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm bg-[var(--bg-surface)] border-[var(--border)] w-full"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 px-4 text-sm flex-shrink-0"
                >
                  <span className="truncate max-w-[120px]">
                    {savedEvent ? savedEvent.eventName : "Select"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 bg-[var(--bg-surface)] border-[var(--border)] overflow-y-auto">
                {filteredEvents.map((event) => (
                  <DropdownMenuItem
                    key={event.eventId}
                    onClick={() => setSelectedEventId(event.eventId)}
                    className="cursor-pointer text-sm"
                  >
                    <div className="truncate">
                      <p className="font-medium">{event.eventName}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {event.activityCode}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:flex flex-col gap-2 flex-shrink-0 mb-1">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-[var(--bg-surface)] border-[var(--border)]"
            />
          </div>

          <div className="hidden md:flex flex-col gap-2 overflow-y-auto pr-2 flex-1">
            {filteredEvents.map((event) => (
              <CustomiseEventPanel
                event={event}
                modules={modules}
                key={event.eventId}
                isSelected={selectedEventId === event.eventId}
                onClick={() => setSelectedEventId(event.eventId)}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:block w-[1px] bg-border self-stretch flex-shrink-0" />

        <div className="flex flex-col gap-4 flex-1 h-full min-h-0">
          <div className="flex items-center justify-between pb-3 border-b min-w-0 md:min-w-[320px] flex-shrink-0">
            <span className="text-sm font-semibold truncate pr-2">
              {tempEvent.eventName}
              {" | "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {getLinkedModuleName(tempEvent, modules) || "No Module Linked"}
              </span>
            </span>
            <div className="flex gap-1.5 flex-shrink-0">
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

          <div className="flex-1 overflow-y-auto pr-2">
            <CustomiseEventCard
              event={tempEvent}
              modules={modules}
              buildings={buildings}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
