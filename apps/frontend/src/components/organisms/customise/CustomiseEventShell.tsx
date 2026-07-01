import { useState } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { CustomiseEventCard } from "@/components/molecules/customise/CustomiseEventCard";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
}

export default function EventsShell({ events, modules }: CustomiseShellProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.eventID,
  );
  const activeEvent =
    events.find((e) => e.eventID === selectedEventId) || events[0];

  return (
    <Card className="w-fit m-6 p-4">
      <div className="flex flex-row gap-6">
        <div className="flex flex-col gap-2 min-w-[240px]">
          <div className="flex gap-1 bg-muted p-1 rounded-md mb-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs flex-1 text-muted-foreground"
            >
              Modules
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs flex-1 font-semibold"
            >
              Events
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <CustomiseEventPanel
                event={event}
                modules={modules}
                key={event.eventID}
                onClick={() => setSelectedEventId(event.eventID)}
              />
            ))}
          </div>
        </div>

        <div className="w-[1px] bg-border self-stretch" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b min-w-[320px]">
            <span className="text-sm font-semibold">
              {activeEvent.eventName}
              {" | "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {activeEvent.eventCode}
              </span>
            </span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                Save
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs"
              >
                Discard
              </Button>
            </div>
          </div>

          <CustomiseEventCard
            event={activeEvent}
            modules={modules}
            onUpdate={() => {}}
          />
        </div>
      </div>
    </Card>
  );
}
