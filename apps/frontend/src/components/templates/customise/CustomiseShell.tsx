import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import CustomiseEventShell from "@/components/organisms/customise/CustomiseEventShell";
import CustomiseModuleShell from "@/components/organisms/customise/CustomiseModuleShell";

interface CustomiseShellProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
}

export default function CustomiseShell({
  events,
  modules,
}: CustomiseShellProps) {
  return (
    <div className="flex flex-row flex-wrap items-start">
      <CustomiseModuleShell modules={modules} events={events} />
      <CustomiseEventShell events={events} modules={modules} />
    </div>
  );
}
