import { useMemo, useState } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import CustomiseModulePanel from "@/components/atoms/customise/CustomiseModulePanel";
import { CustomiseModuleCard } from "@/components/molecules/customise/CustomiseModuleCard";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { MutateOptions, QueryKey, useMutation } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";
import {
  updateModQ,
  updateModStylingQ,
} from "@/app/course-management/queries/modules/moduleQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onViewModeChange?: (tab: "Modules" | "Events") => void;
  invalidateKey?: QueryKey;
}

export default function ModulesShell({
  modules,
  onViewModeChange,
  invalidateKey,
}: CustomiseShellProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    modules[0]?.moduleID,
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter((m) => {
      const matchName = m.moduleName?.toLowerCase().includes(q);
      const matchCode = m.moduleCode?.toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [modules, searchQuery]);

  const savedModule =
    modules.find((m) => m.moduleID === selectedModuleId) || modules[0];

  const [tempModule, setTempModule] = useState<ModuleResponseDto>(savedModule);

  const [prevSavedModule, setPrevSavedModule] = useState(savedModule);

  if (savedModule !== prevSavedModule) {
    setPrevSavedModule(savedModule);
    setTempModule(savedModule);
  }
  const canEdit = UserDetails.userCanEdit();

  const finalOptions = {
    ...updateModQ(),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: invalidateKey,
      });
    },
  };
  const { mutate: saveModule, isPending: isSaving } = useMutation(finalOptions);

  const stylingMutOptions = {
    ...updateModStylingQ(),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: invalidateKey,
      });
    },
  };

  const { mutate: updateStyling } = useMutation(stylingMutOptions);

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

  function handleSave() {
    if (!tempModule) return;
    if (canEdit) {
      saveModule({
        path: { moduleId: tempModule.moduleID },
        body: {
          moduleCode: tempModule.moduleCode,
          moduleName: tempModule.moduleName,
          moduleDescription: tempModule.moduleDescription,
          styling: tempModule.styling,
        },
      });
    } else {
      if (tempModule.styling)
        updateStyling({
          body: { styling: tempModule.styling },
          path: {
            moduleId: tempModule.moduleID,
          },
        });
    }
  }

  function handleDiscard() {
    setTempModule(savedModule);
  }

  if (!tempModule) {
    return null;
  }

  return (
    <Card className="w-[792px] h-[600px] m-6 p-4 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
        <div className="flex flex-col gap-2 w-full md:min-w-[240px] md:w-auto h-auto md:h-full flex-shrink-0">
          <div className="flex gap-1 bg-muted p-1 rounded-md mb-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs flex-1 text-muted-foreground cursor-pointer"
              onClick={() => {
                onViewModeChange?.("Events");
              }}
            >
              Events
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs flex-1 font-semibold cursor-pointer"
            >
              Modules
            </Button>
          </div>

          <div className="md:hidden flex flex-row items-center gap-2 flex-shrink-0 mb-2">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm bg-[var(--bg-surface)] border-[var(--border)] w-full"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 px-4 text-sm flex-shrink-0"
                >
                  <span className="truncate max-w-[120px]">
                    {savedModule ? savedModule.moduleName : "Select"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 bg-[var(--bg-surface)] border-[var(--border)] overflow-y-auto">
                {filteredModules.map((module) => (
                  <DropdownMenuItem
                    key={module.moduleID}
                    onClick={() => setSelectedModuleId(module.moduleID)}
                    className="cursor-pointer text-xs"
                  >
                    <div className="truncate">
                      <p className="font-medium">{module.moduleName}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {module.moduleCode}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:flex flex-col gap-2 flex-shrink-0 mb-1">
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-[var(--bg-surface)] border-[var(--border)]"
            />
          </div>

          <div className="hidden md:flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
            {filteredModules.map((module) => (
              <CustomiseModulePanel
                module={module}
                key={module.moduleID}
                isSelected={selectedModuleId === module.moduleID}
                onClick={() => setSelectedModuleId(module.moduleID)}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:block w-[1px] bg-border self-stretch flex-shrink-0" />

        <div className="flex flex-col gap-4 flex-1 h-full min-h-0">
          <div className="flex items-center justify-between pb-3 border-b min-w-0 md:min-w-[320px] flex-shrink-0">
            <span className="text-sm font-semibold truncate pr-2">
              {tempModule.moduleName}
              {" | "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {tempModule.moduleCode}
              </span>
            </span>
            <div className="flex gap-1.5 flex-shrink-0">
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

          <div className="flex-1 overflow-y-auto pr-2">
            <CustomiseModuleCard module={tempModule} onUpdate={handleUpdate} />
          </div>
        </div>
      </div>
    </Card>
  );
}
