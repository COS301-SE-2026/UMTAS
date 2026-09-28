"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  VisionEvent,
  VisionFilters,
  VisionModule,
} from "../../../../utilities/vision-stats/VisionTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Button } from "@/components/atoms/baseShadcn/button";

export interface VisionFilterBarProps {
  modules: VisionModule[];
  events: VisionEvent[];
  filters: VisionFilters;
  setFilters: Dispatch<SetStateAction<VisionFilters>>;
  selectedEventId?: string;
  onEventChange?: (eventId?: string) => void;
}

export default function VisionFilterBar({
  modules,
  events,
  filters,
  setFilters,
  selectedEventId,
  onEventChange,
}: VisionFilterBarProps) {
  const [sessionSearch, setSessionSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previousFilters) => ({
        ...previousFilters,
        search: sessionSearch.trim() || undefined,
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [sessionSearch, setFilters]);

  const updateFilters = (updatedFields: Partial<VisionFilters>) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      ...updatedFields,
    }));
  };

  const filteredModules = modules.filter((module) =>
    module.name.toLowerCase().includes(moduleSearch.trim().toLowerCase()),
  );

  const availableEvents = events.filter((event) => {
    const matchesModule =
      !filters.moduleId || event.moduleId === filters.moduleId;
    const matchesType =
      !filters.eventType || event.activityType === filters.eventType;
    const matchesSearch = event.name
      .toLowerCase()
      .includes(eventSearch.trim().toLowerCase());
    return matchesModule && matchesType && matchesSearch;
  });

  const availableEventsForTypes = events.filter(
    (event) => !filters.moduleId || event.moduleId === filters.moduleId,
  );

  const eventTypes: string[] = [];
  for (const event of availableEventsForTypes) {
    if (!eventTypes.includes(event.activityType)) {
      eventTypes.push(event.activityType);
    }
  }

  const handleClearFilters = () => {
    setSessionSearch("");
    setModuleSearch("");
    setEventSearch("");
    setFilters({});
    if (onEventChange) {
      onEventChange(undefined);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm">Session name</label>
        <Input
          className="w-40"
          placeholder="Search sessions"
          value={sessionSearch}
          onChange={(event) => setSessionSearch(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm">Filter modules</label>
        <Input
          className="w-40"
          placeholder="Search module"
          value={moduleSearch}
          onChange={(event) => setModuleSearch(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm">Module</label>
        <Select
          value={filters.moduleId ?? "all"}
          onValueChange={(selectedModuleId) => {
            updateFilters({
              moduleId:
                selectedModuleId === "all" ? undefined : selectedModuleId,
              eventType: undefined,
            });
            if (onEventChange) {
              onEventChange(undefined);
            }
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"all"}>All modules</SelectItem>
            {filteredModules.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onEventChange && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm">Filter events</label>
            <Input
              className="w-40"
              placeholder="Search event"
              value={eventSearch}
              onChange={(event) => setEventSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm">Event</label>
            <Select
              value={selectedEventId ?? "all"}
              onValueChange={(eventId) =>
                onEventChange(eventId === "all" ? undefined : eventId)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>All events</SelectItem>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm">Event type</label>
        <Select
          value={filters.eventType ?? "all"}
          disabled={!filters.moduleId}
          onValueChange={(selectedEventType) => {
            updateFilters({
              eventType:
                selectedEventType === "all" ? undefined : selectedEventType,
            });
            if (onEventChange) {
              onEventChange(undefined);
            }
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"all"}>All types</SelectItem>
            {eventTypes.map((activityType) => (
              <SelectItem
                key={activityType}
                value={activityType}
                className="capitalize"
              >
                {activityType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm">From</label>
        <Input
          type="date"
          className="w-40"
          value={filters.from ?? ""}
          onChange={(event) =>
            updateFilters({ from: event.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm">To</label>
        <Input
          type="date"
          className="w-40"
          value={filters.to ?? ""}
          onChange={(event) =>
            updateFilters({ to: event.target.value || undefined })
          }
        />
      </div>

      <Button variant="destructive" onClick={handleClearFilters}>
        Clear
      </Button>
    </div>
  );
}
