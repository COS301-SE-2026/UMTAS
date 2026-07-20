"use client";

import { CustomiseEventCard } from "../customise/CustomiseEventCard";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import { useState } from "react";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
  events: EventResponse[];
}

export default function SolverReviewCard({
  modules,
  events,
}: SolverReviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );

  return (
    <>
      {events.map((event) => {
        return (
          <div key={event.eventID}>
            <CustomiseEventPanel
              key={event.eventID}
              event={event}
              modules={modules}
              onClick={() => {
                setSelectedEvent(
                  selectedEvent?.eventID === event.eventID ? null : event,
                );
              }}
            />
            {selectedEvent?.eventID === event.eventID && (
              <CustomiseEventCard
                event={event}
                modules={modules}
                onUpdate={() => {}}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
