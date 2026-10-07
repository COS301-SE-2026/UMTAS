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
import { EventsTable } from "@/components/organisms/module-management/eventsTable";
import { eventCols } from "@/components/organisms/module-management/eventsColumns";
import CustomiseEventPopup from "@/components/organisms/customise/customiseEventPopup";
import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";

const steps = [
  {
    target: "#input-search-event-code",
    content: "Search for an event by name, activity code, or module code.",
  },
  {
    target: "#event-row",
    content: "Select an event to open its specific customization options.",
  },
];

export default function EventManagementTemplate() {
  const { university, isLoading: isUniversityLoading } = useUniversityState();
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: moduleData, isLoading: isModulesLoading } = useQuery({
    queryKey: ["ModulesV2", university?.UniversityID],
    queryFn: async () => {
      const result = await fetchAllModulesv2({
        universityId: university!.UniversityID,
        userEnrollment: false,
      });

      return result.modules;
    },
    enabled: !isUniversityLoading && university != null,
  });

  const eventData = useMemo(() => {
    return (
      moduleData?.flatMap((module) =>
        (module.Events ?? []).map((event) => ({
          ...event,
          module,
        })),
      ) ?? []
    );
  }, [moduleData]);

  const filteredEvents = useMemo(() => {
    return (
      eventData?.filter((event) => {
        const searchLowercase = searchQuery.toLowerCase();

        const matchesSearch =
          searchQuery === "" ||
          event.eventName?.toLowerCase().includes(searchLowercase) ||
          event.activityCode?.toLowerCase().includes(searchLowercase) ||
          event.module?.moduleCode?.toLowerCase().includes(searchLowercase);

        return matchesSearch;
      }) ?? []
    );
  }, [eventData, searchQuery]);

  const ViableRole =
    university?.role === "UNIVERSITY_ADMIN" ||
    university?.role === "LECTURER" ||
    university?.role === "STUDENT";

  if (isUniversityLoading || isModulesLoading)
    return <UniversityStateLoading />;

  const hasRole = university?.role != null;
  if (!hasRole) return <NoRoleSelected />;

  if (!ViableRole) {
    return <NotFound />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 pt-4">
      <Tutorial steps={steps} wait={true} />

      <div className="flex w-full max-w-6xl flex-col items-start gap-4 md:flex-row md:justify-between">
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

      <div className="w-full max-w-6xl overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
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
