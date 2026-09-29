"use client";

import { NoPermissionsEventCard } from "@/components/molecules/solver/NoPermissionsEventCard";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Button } from "@/components/atoms/baseShadcn/button";
import { X } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateEventMut } from "@/components/templates/builder/Queries/eventQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/customise/alert-dialog-customise";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
}

export default function SolverReviewCard({ modules }: SolverReviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );
  const [tempEvent, setTempEvent] = useState<EventResponse | null>(null);

  const updateEventMutation = useMutation({
    ...updateEventMut(),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["PDF", "MODULES"],
      });
    },
  });

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

  async function handleSave() {
    if (!tempEvent) {
      return;
    }

    await updateEventMutation.mutateAsync({
      path: {
        id: tempEvent.eventId,
      },
      body: {
        eventName: tempEvent.eventName,
        activityCode: tempEvent.activityCode,
        activityType: tempEvent.activityType,
        isRecurring: tempEvent.isRecurring,
        eventCriteria: tempEvent.eventCriteria,
      },
    });

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
                <AlertDialogContent className="w-full max-w-2xl gap-0 overflow-hidden p-0 bg-(--bg-surface)">
                  <AlertDialogCancel asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleDiscard}
                      className="absolute right-4 top-4 z-10 border-none bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogCancel>

                  <AlertDialogHeader className="p-4 pr-12">
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

                  <div className="flex justify-center p-4">
                    <Button
                      size="sm"
                      disabled={!eventChange || updateEventMutation.isPending}
                      onClick={handleSave}
                    >
                      Save
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
