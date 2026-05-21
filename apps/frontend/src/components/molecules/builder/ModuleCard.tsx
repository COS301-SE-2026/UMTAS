"use client";

import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  ColourPicker,
  Module_Colours,
} from "@/components/atoms/builder/colourPicker";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

export interface ModuleErrors {
  moduleCode?: string;
  moduleName?: string;
  styling?: string;
}

interface ModuleCardProps {
  module: ModuleResponseDto;
  index: number;
  onUpdate: (
    id: number,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID">,
    value: string,
  ) => void;
  onRemove: (id: number) => void;
  errors?: ModuleErrors;
}

export function ModuleCard({
  module,
  index,
  onUpdate,
  onRemove,
  errors,
}: ModuleCardProps) {
  const inputClass =
    "h-10 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] " +
    "placeholder:text-[var(--text-disabled)] focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-[var(--ring)] text-sm";

  function getInputClass(hasError: boolean) {
    if (hasError) {
      return inputClass + " border-[var(--error-text)]";
    }
    return inputClass;
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]">
      {/* fields */}
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {/* module code */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"module-code-" + module.moduleID}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Code
          </Label>
          <Input
            id={"module-code-" + module.moduleID}
            value={module.moduleCode}
            onChange={(e) =>
              onUpdate(module.moduleID, "moduleCode", e.target.value)
            }
            placeholder="e.g. COS301"
            maxLength={10}
            className={getInputClass(!!errors?.moduleCode)}
          />
          {errors?.moduleCode && (
            <p className="text-sm text-[var(--error-text)]">
              {errors.moduleCode}
            </p>
          )}
        </div>

        {/* module name */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"module-name-" + module.moduleID}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Name
          </Label>
          <Input
            id={"module-name-" + module.moduleID}
            value={module.moduleName}
            onChange={(e) =>
              onUpdate(module.moduleID, "moduleName", e.target.value)
            }
            placeholder="e.g. Software Engineering"
            className={getInputClass(!!errors?.moduleName)}
          />
          {errors?.moduleName && (
            <p className="text-sm text-[var(--error-text)]">
              {errors.moduleName}
            </p>
          )}
        </div>

        {/* module colour */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label className="text-sm font-medium text-[var(--text-secondary)]">
            Colour
          </Label>
          <ColourPicker
            value={module.styling || ""}
            onChange={(colour) => onUpdate(module.moduleID, "styling", colour)}
          />
          {errors?.styling && (
            <p className="text-sm text-[var(--error-text)]">{errors.styling}</p>
          )}
        </div>
      </div>
    </div>
  );
}
