"use client";

import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/atoms/customise/alert-dialog-customise";
import { X } from "lucide-react";
import EventsShell from "./CustomiseEventShell";

interface CustomiseEventPopupProps {
  event: EventResponse;
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onClose: () => void;
}

export default function CustomiseEventPopup({
  event,
  events,
  modules,
  onClose,
}: CustomiseEventPopupProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-fit flex flex-col pr-14 pl-2">
        <AlertDialogHeader className="flex flex-row justify-between items-center">
          <AlertDialogTitle className="text-xl font-bold pl-6">
            Customise Events
          </AlertDialogTitle>
          <AlertDialogCancel className="cursor-pointer h-8 w-8 rounded-full bg-transparent border-transparent">
            <X className="h-4 w-4" />
          </AlertDialogCancel>
        </AlertDialogHeader>

        <EventsShell
          events={events}
          modules={modules}
          initialEventId={event.eventId}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
