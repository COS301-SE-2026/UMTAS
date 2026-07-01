import { useState } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import CustomiseModulePanel from "@/components/atoms/customise/CustomiseModulePanel";
import { CustomiseModuleCard } from "@/components/molecules/customise/CustomiseModuleCard";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
}

export default function ModulesShell({ modules }: CustomiseShellProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    modules[0]?.moduleID,
  );
  const activeModule =
    modules.find((m) => m.moduleID === selectedModuleId) || modules[0];
  return (
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
              <CustomiseModulePanel
                module={module}
                key={module.moduleID}
                onClick={() => setSelectedModuleId(module.moduleID)}
              />
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

          <CustomiseModuleCard module={activeModule} onUpdate={() => {}} />
        </div>
      </div>
    </Card>
  );
}
