"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/atoms/baseShadcn/sheet";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { Badge } from "@/components/atoms/baseShadcn/badge";

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
  const [isOpen, setIsOpen] = useState(false);

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

  const activeFiltersCount = [
    Boolean(filters.search),
    Boolean(filters.moduleId),
    Boolean(selectedEventId),
    Boolean(filters.eventType),
    Boolean(filters.from),
    Boolean(filters.to),
  ].filter(Boolean).length;

  const selectedModuleName = modules.find(
    (module) => module.id === filters.moduleId,
  )?.name;
  const selectedEventName = events.find(
    (event) => event.id === selectedEventId,
  )?.name;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4" strokeWidth={1.5} />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-0.5 text-[11px]"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[340px] sm:w-[420px] flex flex-col justify-between p-6 bg-bg-surface"
            >
              <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-lg">Filter Sessions</SheetTitle>
                  <SheetDescription>
                    Narrow down sessions by title, module, event, and dates.
                  </SheetDescription>
                </SheetHeader>

                <Separator />

                <div className="flex flex-col gap-1">
                  <label className="text-sm">Session name</label>
                  <Input
                    className="bg-bg-base"
                    placeholder="Search sessions"
                    value={sessionSearch}
                    onChange={(event) => setSessionSearch(event.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm">Filter modules</label>
                  <Input
                    className="bg-bg-base"
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
                          selectedModuleId === "all"
                            ? undefined
                            : selectedModuleId,
                        eventType: undefined,
                      });
                      if (onEventChange) {
                        onEventChange(undefined);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-bg-base">
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
                        className="bg-bg-base"
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
                        <SelectTrigger className="w-full bg-bg-base">
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
                          selectedEventType === "all"
                            ? undefined
                            : selectedEventType,
                      });

                      if (onEventChange) {
                        onEventChange(undefined);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-bg-base">
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
                    className="bg-bg-base"
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
                    className="bg-bg-base"
                    value={filters.to ?? ""}
                    onChange={(event) =>
                      updateFilters({ to: event.target.value || undefined })
                    }
                  />
                </div>
              </div>

              <SheetFooter className="pt-4 border-t flex flex-row gap-2 justify-end">
                <Button variant="ghost" onClick={handleClearFilters}>
                  Clear all
                </Button>
                <Button onClick={() => setIsOpen(false)}>Apply</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
