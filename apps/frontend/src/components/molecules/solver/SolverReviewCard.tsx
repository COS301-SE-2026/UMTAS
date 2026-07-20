"use client";

import { NoPermissionsEventCard } from "@/components/molecules/solver/NoPermissionsEventCard";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useState } from "react";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
  events: EventResponse[];
  onUpdateEvents: React.Dispatch<React.SetStateAction<EventResponse[]>>;
}

export default function SolverReviewCard({
  modules,
  events,
  onUpdateEvents,
}: SolverReviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );

  const [tempEvent, setTempEvent] = useState<EventResponse | null>(null);

  const handleSelect = (event: EventResponse) => {
    if (selectedEvent?.eventID === event.eventID) {
      setSelectedEvent(null);
      setTempEvent(null);
    } else {
      setSelectedEvent(event);
      setTempEvent(event);
    }
  };

  function handleUpdate(id: string, field: string, value: string | boolean) {
    setTempEvent((previous) => {
      if (!previous) {
        return previous;
      }

      const rootFields = ["eventName", "eventCode", "isRecurring"];

      if (rootFields.includes(field)) {
        return {
          ...previous,
          [field]: value,
        };
      }

      return {
        ...previous,
        eventCriteria: {
          ...previous.eventCriteria,
          [field]: value,
        },
      };
    });
  }

  function handleSave() {
    if (!tempEvent) {
      return;
    }

    onUpdateEvents((previousEvents) => {
      const updatedEvents = previousEvents.map((event) =>
        event.eventID === tempEvent.eventID ? tempEvent : event,
      );

      return updatedEvents;
    });

    setSelectedEvent(null);
    setTempEvent(null);
  }

  return (
    <>
      {events.map((event) => {
        const isSelected = selectedEvent?.eventID === event.eventID;
        const eventChange =
          tempEvent && JSON.stringify(tempEvent) !== JSON.stringify(event);

        return (
          <div key={event.eventID} className="space-y-2 border-b pb-4">
            <CustomiseEventPanel
              event={isSelected && tempEvent ? tempEvent : event}
              modules={modules}
              onClick={() => handleSelect(event)}
            />

            {isSelected && tempEvent && (
              <div className="pl-4 space-y-2">
                <NoPermissionsEventCard
                  event={tempEvent}
                  modules={modules}
                  onUpdate={handleUpdate}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!eventChange}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!eventChange}
                    onClick={() => {
                      setTempEvent(selectedEvent);
                    }}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
