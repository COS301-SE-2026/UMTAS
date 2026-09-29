"use client";

import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { ColourPicker } from "@/components/atoms/builder/colourPicker";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { UserDetails } from "@/lib/userclass/userClass";
import type { ModuleErrors } from "./CustomiseModuleCard";

interface EditModuleCardProps {
  module: ModuleResponseDto;
  onUpdate: (
    id: string,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID">,
    value: string,
  ) => void;
  errors?: ModuleErrors;
}

export function EditModuleCard({
  module,
  onUpdate,
  errors,
}: EditModuleCardProps) {
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
  const canEdit = UserDetails.userCanEdit();

  return (
    <div className="flex flex-col gap-4">
      {/*module general stuff */}
      <div>
        <Label className="text-sm font-medium text-[var(--text-primary)] mb-4">
          General
        </Label>
        <div className="flex flex-col gap-4">
          {/* module code */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor={"module-code-" + module.moduleID}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              Code
            </Label>
            <Input
              data-testid="update-module-code"
              id={"module-code-" + module.moduleID}
              value={module.moduleCode}
              onChange={(e) =>
                onUpdate(module.moduleID, "moduleCode", e.target.value)
              }
              readOnly={!canEdit}
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
              data-testid="update-module-name"
              id={"module-name-" + module.moduleID}
              value={module.moduleName}
              onChange={(e) =>
                onUpdate(module.moduleID, "moduleName", e.target.value)
              }
              readOnly={!canEdit}
              placeholder="e.g. Software Engineering"
              className={getInputClass(!!errors?.moduleName)}
            />
            {errors?.moduleName && (
              <p className="text-sm text-[var(--error-text)]">
                {errors.moduleName}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-[var(--border)]" />

      {/*colour*/}
      <div>
        <Label className="text-sm font-medium text-[var(--text-primary)] mb-4">
          Styling
        </Label>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-[var(--text-secondary)]">
            Colour
          </Label>
          <ColourPicker
            value={module.styling?.colour || ""}
            onChange={(colour) => {
              onUpdate(module.moduleID, "styling", colour);
            }}
          />
          {errors?.styling && (
            <p className="text-sm text-[var(--error-text)]">{errors.styling}</p>
          )}
        </div>
      </div>
    </div>
  );
}
