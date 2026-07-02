import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import CustomiseEventShell from "@/components/organisms/customise/CustomiseEventShell";
import CustomiseModuleShell from "@/components/organisms/customise/CustomiseModuleShell";
import { useState } from "react";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onViewModeChange?: (mode: "Modules" | "Events") => void;
}

export default function CustomiseShell({
  events,
  modules,
}: CustomiseShellProps) {
  const [viewMode, setViewMode] = useState<"Modules" | "Events">("Modules");

  function renderView() {
    if (viewMode === "Modules") {
      return (
        <CustomiseModuleShell
          modules={modules}
          events={events}
          onViewModeChange={setViewMode}
        />
      );
    }

    return (
      <CustomiseEventShell
        events={events}
        modules={modules}
        onViewModeChange={setViewMode}
      />
    );
  }
  return (
    <div className="flex flex-row flex-wrap items-start">{renderView()}</div>
  );
}
