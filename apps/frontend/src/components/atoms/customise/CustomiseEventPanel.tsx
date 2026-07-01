import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

interface EventPanelProps {
  event: EventResponse;
  modules: ModuleResponseDto[];
  onClick?: () => void;
}

export default function CustomiseEventPanel({
  event,
  modules,
  onClick,
}: EventPanelProps) {
  const assignedModule = modules.find(
    (module: ModuleResponseDto) =>
      module.moduleCode === event.eventCriteria.moduleID,
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left"
        >
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor: assignedModule?.styling?.colour ?? "transparent",
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-[var(--text-primary)] truncate">
              {event.eventName}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-sm text-[var(--text-secondary)]">
                {event.eventCriteria.startTime}
              </p>
              <p className="text-sm font-mono text-[var(--text-secondary)]">
                {event.eventCode}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
