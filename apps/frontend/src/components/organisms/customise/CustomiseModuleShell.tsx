import { useState } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import CustomiseModulePanel from "@/components/atoms/customise/CustomiseModulePanel";
import { CustomiseModuleCard } from "@/components/molecules/customise/CustomiseModuleCard";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { useMutation } from "@tanstack/react-query";
import { updateModuleMut } from "@/components/templates/builder/Queries/moduleQueries";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onViewModeChange?: (tab: "Modules" | "Events") => void;
}

export default function ModulesShell({
  modules,
  onViewModeChange,
}: CustomiseShellProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    modules[0]?.moduleID,
  );

  const savedModule =
    modules.find((m) => m.moduleID === selectedModuleId) || modules[0];

  //this keeps track of what has been changed
  const [tempModule, setTempModule] = useState<ModuleResponseDto>(savedModule);

  //when saved set to temp
  const [prevSavedModule, setPrevSavedModule] = useState(savedModule);

  if (savedModule !== prevSavedModule) {
    setPrevSavedModule(savedModule);
    setTempModule(savedModule);
  }

  //mutation for updating
  const { mutate: saveModule, isPending: isSaving } =
    useMutation(updateModuleMut());

  //bool check if the module actually changed
  const didModuleChange =
    !!tempModule &&
    !!savedModule &&
    JSON.stringify(tempModule) !== JSON.stringify(savedModule);

  function handleUpdate(
    id: string,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID">,
    value: string,
  ) {
    setTempModule((prev) => {
      if (!prev) {
        return prev;
      }

      if (field === "styling") {
        return { ...prev, styling: { ...prev.styling, colour: value } };
      }

      return { ...prev, [field]: value };
    });
  }

  //what gets called in the component
  function handleSave() {
    if (!tempModule) return;
    saveModule({
      moduleID: tempModule.moduleID,
      module: {
        moduleCode: tempModule.moduleCode,
        moduleName: tempModule.moduleName,
        moduleDescription: tempModule.moduleDescription,
        styling: tempModule.styling,
      },
    });
  }

  function handleDiscard() {
    setTempModule(savedModule);
  }

  if (!tempModule) {
    return null;
  }

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
              onClick={() => {
                onViewModeChange?.("Events");
              }}
            >
              Events
            </Button>
          </div>

          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
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
              {tempModule.moduleName}
              {" | "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {tempModule.moduleCode}
              </span>
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                disabled={!didModuleChange || isSaving}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs"
                disabled={!didModuleChange}
                onClick={handleDiscard}
              >
                Discard
              </Button>
            </div>
          </div>

          <CustomiseModuleCard module={tempModule} onUpdate={handleUpdate} />
        </div>
      </div>
    </Card>
  );
}
