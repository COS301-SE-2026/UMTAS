import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

interface ModulePanelProps {
  module: ModuleResponseDto;
  onClick?: () => void;
}

export default function CustomiseModulePanel({
  module,
  onClick,
}: ModulePanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex flex-1 items-center gap-3 rounded-lg border px-4 py-4 text-left"
        >
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: module.styling?.colour ?? "transparent" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-[var(--text-primary)] truncate">
              {module.moduleName}
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              {module.moduleCode}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
