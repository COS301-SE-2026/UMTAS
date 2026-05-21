"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import {
  ModuleCard,
  type ModuleErrors,
} from "@/components/molecules/builder/ModuleCard";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

interface ModuleFormPanelProps {
  module: ModuleResponseDto;
  onUpdate: (
    id: number,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID">,
    value: string,
  ) => void;
  onClose: () => void;
  onDone: () => void;
}

function validateModule(module: ModuleResponseDto) {
  const errors: ModuleErrors = {};
  let hasErrors = false;

  if (!module.moduleCode.trim()) {
    errors.moduleCode = "Code is required";
    hasErrors = true;
  }
  if (!module.moduleName.trim()) {
    errors.moduleName = "Name is required";
    hasErrors = true;
  }
  if (!module.styling) {
    errors.styling = "Colour is required";
    hasErrors = true;
  }

  return { errors, hasErrors };
}

export function ModuleFormPanel({
  module,
  onUpdate,
  onClose,
  onDone,
}: ModuleFormPanelProps) {
  const [errors, setErrors] = useState<ModuleErrors>({});

  function handleDone() {
    const { errors: validationErrors, hasErrors } = validateModule(module);
    if (hasErrors) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onDone();
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title="Module"
        onClose={onClose}
        action={
          <Button
            type="button"
            size="sm"
            onClick={handleDone}
            className="h-7 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90"
          >
            Done
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4">
        <ModuleCard module={module} onUpdate={onUpdate} errors={errors} />
      </div>
    </div>
  );
}
