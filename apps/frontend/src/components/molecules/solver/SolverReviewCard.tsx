"use client";

import { NoPermissionsEventCard } from "@/components/molecules/solver/NoPermissionsEventCard";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/customise/alert-dialog-customise";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
  onUpdateEvents: React.Dispatch<React.SetStateAction<EventResponse[]>>;
}

export default function SolverReviewCard({
  modules,
  onUpdateEvents,
}: SolverReviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );
  const [tempEvent, setTempEvent] = useState<EventResponse | null>(null);

  const handleSelect = (event: EventResponse) => {
    if (selectedEvent?.eventId === event.eventId) {
      setSelectedEvent(null);
      setTempEvent(null);
      return;
    }

    setSelectedEvent(event);
    setTempEvent(event);
  };

  function handleUpdate(_id: string, field: string, value: string | boolean) {
    setTempEvent((previous) => {
      if (!previous) {
        return previous;
      }

      const rootFields = [
        "eventName",
        "activityCode",
        "activityType",
        "isRecurring",
      ];

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

    onUpdateEvents((previousEvents) =>
      previousEvents.map((event) =>
        event.eventId === tempEvent.eventId ? tempEvent : event,
      ),
    );

    setSelectedEvent(null);
    setTempEvent(null);
  }

  function handleDiscard() {
    setSelectedEvent(null);
    setTempEvent(null);
  }

  return (
    <>
      {modules.map((module) =>
        module?.Events?.map((event) => {
          const isSelected = selectedEvent?.eventId === event.eventId;

          const eventChange =
            !!tempEvent && JSON.stringify(tempEvent) !== JSON.stringify(event);

          return (
            <div key={event.eventId} className="space-y-2 border-b pb-4">
              <CustomiseEventPanel
                event={isSelected && tempEvent ? tempEvent : event}
                modules={modules}
                isSelected={isSelected}
                onClick={() => handleSelect(event)}
              />

              <AlertDialog
                open={isSelected}
                onOpenChange={(open) => {
                  if (!open) {
                    handleDiscard();
                  }
                }}
              >
                <AlertDialogContent className="w-full max-w-2xl gap-0 overflow-hidden p-0">
                  <AlertDialogHeader className="border-b border-[var(--border)] p-6">
                    <AlertDialogTitle className="text-xl font-semibold text-[var(--text-primary)]">
                      Review Event
                    </AlertDialogTitle>
                  </AlertDialogHeader>

                  <div className="max-h-[70vh] overflow-y-auto p-6">
                    {tempEvent && (
                      <NoPermissionsEventCard
                        event={tempEvent}
                        modules={modules}
                        onUpdate={handleUpdate}
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-[var(--border)] p-6">
                    <AlertDialogCancel asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDiscard}
                      >
                        Discard & Close
                      </Button>
                    </AlertDialogCancel>

                    <Button
                      size="sm"
                      disabled={!eventChange}
                      onClick={handleSave}
                    >
                      Save & Close
                    </Button>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }),
      )}
    </>
  );
}
