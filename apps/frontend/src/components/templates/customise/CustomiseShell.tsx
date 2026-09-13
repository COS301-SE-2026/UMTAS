import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import CustomiseEventShell from "@/components/organisms/customise/CustomiseEventShell";
import CustomiseModuleShell from "@/components/organisms/customise/CustomiseModuleShell";
import { useState } from "react";
import { QueryKey } from "@tanstack/react-query";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onViewModeChange?: (mode: "Modules" | "Events") => void;
  invalidateKey?: QueryKey;
}

export default function CustomiseShell({
  events,
  modules,
  invalidateKey,
}: CustomiseShellProps) {
  const [viewMode, setViewMode] = useState<"Events" | "Modules">("Events");

  function renderView() {
    if (viewMode === "Events" || events.length === 0) {
      return (
        <CustomiseEventShell
          events={events}
          modules={modules}
          onViewModeChange={setViewMode}
        />
      );
    }

    return (
      <CustomiseModuleShell
        modules={modules}
        events={events}
        onViewModeChange={setViewMode}
        invalidateKey={invalidateKey}
      />
    );
  }
  return (
    <div className="flex flex-row flex-wrap items-start">{renderView()}</div>
  );
}
