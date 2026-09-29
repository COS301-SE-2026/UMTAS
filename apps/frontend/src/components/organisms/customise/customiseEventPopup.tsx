"use client";

import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/baseShadcn/dialog";
import EventsOnlyShell from "./CustomiseEventOnlyShell";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[768px] max-w-[95vw] sm:max-w-[768px] bg-[var(--bg-surface)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Customise Events
          </DialogTitle>
        </DialogHeader>

        <EventsOnlyShell
          events={events}
          modules={modules}
          initialEventId={event.eventId}
        />
      </DialogContent>
    </Dialog>
  );
}
