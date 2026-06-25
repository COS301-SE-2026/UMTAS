import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import CustomiseModulePanel from "@/components/atoms/customise/CustomiseModulePanel";
import { CustomiseEventCard } from "@/components/molecules/customise/CustomiseEventCard";
import { CustomiseModuleCard } from "@/components/molecules/customise/CustomiseModuleCard";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { useState } from "react";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
}
export default function CustomiseShell({
  events,
  modules,
}: CustomiseShellProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(
    modules[0]?.moduleID,
  );
  const activeModule =
    modules.find((m) => m.moduleID === selectedModuleId) || modules[0];

  const [selectedEventId, setSelectedEventId] = useState<number>(
    events[0]?.event.eventID,
  );
  const activeEvent =
    events.find((e) => e.event.eventID === selectedEventId) || events[0];
  return (
    <div className="flex flex-row flex-wrap items-start">
      <Card className="w-fit m-6 p-4">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <div className="flex gap-1 bg-muted p-1 rounded-md mb-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs flex-1 font-semibold"
              >
                Modules
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs flex-1 text-muted-foreground"
              >
                Events
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {modules.map((module) => (
                <button
                  key={module.moduleID}
                  type="button"
                  onClick={() => setSelectedModuleId(module.moduleID)}
                  className="text-left w-full"
                >
                  <CustomiseModulePanel module={module} />
                </button>
              ))}
            </div>
          </div>

          <div className="w-[1px] bg-border self-stretch" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b min-w-[320px]">
              <span className="text-sm font-semibold">
                {activeModule.moduleName}
                {" | "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {activeModule.moduleCode}
                </span>
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs"
                >
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

            <CustomiseModuleCard module={activeModule} onUpdate={() => {}} />
          </div>
        </div>
      </Card>

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
                <button
                  key={event.event.eventID}
                  type={"button"}
                  onClick={() => setSelectedEventId(event.event.eventID)}
                >
                  <CustomiseEventPanel event={event} modules={modules} />
                </button>
              ))}
            </div>
          </div>

          <div className="w-[1px] bg-border self-stretch" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b min-w-[320px]">
              <span className="text-sm font-semibold">
                {activeEvent.event.name}
                {" | "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {activeEvent.event.code}
                </span>
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs"
                >
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
    </div>
  );
}
