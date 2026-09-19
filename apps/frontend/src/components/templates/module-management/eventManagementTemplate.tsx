"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useMemo } from "react";
import { Input } from "@/components/atoms/baseShadcn/input";

import Tutorial from "@/components/organisms/nav/Tutorial";
import NotFound from "@/app/not-found";

import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { getAllEventsQ } from "../builder/Queries/eventQueries";
import { getAllModulesQ } from "../builder/Queries/moduleQueries";
import { EventsTable } from "@/components/organisms/module-management/eventsTable";
import { eventCols } from "@/components/organisms/module-management/eventsColumns";
import CustomiseEventPopup from "@/components/organisms/customise/customiseEventPopup";
const steps = [
  {
    target: "#input-search-event",
    content: "Search for an event by name, activity code, or module code.",
  },
  {
    target: "#select-event-type",
    content: "Filter events using type or prefix filters.",
  },
  {
    target: "#row-event-row",
    content: "Select an event to open its specific customization options.",
  },
];

export default function EventManagementTemplate() {
  const { university, isLoading: isUniversityLoading } = useUniversityState();
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const { data: eventData, isLoading: isEventsLoading } = useQuery({
    ...getAllEventsQ(),
    enabled: !isUniversityLoading && university != null,
  });

  const { data: moduleData, isLoading: isModulesLoading } = useQuery({
    ...getAllModulesQ(),
    enabled: !isUniversityLoading && university != null,
  });

  const filteredEvents = useMemo(() => {
    return (
      eventData?.filter((event) => {
        const typeMatch =
          selectedType === "All" ||
          event.eventName?.toUpperCase().startsWith(selectedType);

        const searchLowercase = searchQuery.toLowerCase();
        const matchesSearch =
          searchQuery === "" ||
          event.eventName?.toLowerCase().includes(searchLowercase) ||
          event.activityCode?.toLowerCase().includes(searchLowercase);

        return typeMatch && matchesSearch;
      }) ?? []
    );
  }, [eventData, selectedType, searchQuery]);

  const ViableRole =
    university?.role === "UNIVERSITY_ADMIN" ||
    university?.role === "LECTURER" ||
    university?.role === "STUDENT";

  if (isUniversityLoading || isEventsLoading || isModulesLoading)
    return <UniversityStateLoading />;

  const hasRole = university?.role != null;
  if (!hasRole) return <NoRoleSelected />;

  if (!ViableRole) {
    return <NotFound />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 pt-6">
      <Tutorial steps={steps} wait={true} />

      <div className="w-full max-w-6xl overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Event Management
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Search and filter events and their modules.
          </p>
        </div>

        <div className="flex flex-col gap-4 bg-[var(--bg-surface)] p-5 md:flex-row md:items-start md:justify-between">
          <div className="w-full md:max-w-sm flex-1">
            <Input
              id="input-search-event-code"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)]"
            />
          </div>
        </div>

        <EventsTable
          columns={eventCols}
          data={filteredEvents}
          onRowClick={setSelectedEvent}
        />
      </div>

      {selectedEvent && (
        <CustomiseEventPopup
          event={selectedEvent}
          events={eventData ?? []}
          modules={moduleData ?? []}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
