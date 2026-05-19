"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import {
  ModuleCard,
  type Module,
  type ModuleErrors,
} from "@/components/molecules/builder/ModuleCard";

interface ModuleFormPanelProps {
  module: Module;
  onUpdate: (
    id: string,
    field: keyof Omit<Module, "id">,
    value: string,
  ) => void;
  onClose: () => void;
  onDone: () => void;
}

function validateModule(module: Module) {
  const errors: ModuleErrors = {};
  let hasErrors = false;

  if (!module.code.trim()) {
    errors.code = "Code is required";
    hasErrors = true;
  }
  if (!module.name.trim()) {
    errors.name = "Name is required";
    hasErrors = true;
  }
  if (!module.colour) {
    errors.colour = "Colour is required";
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
        <ModuleCard
          module={module}
          index={0}
          onUpdate={onUpdate}
          onRemove={() => {}}
          errors={errors}
        />
      </div>
    </div>
  );
}
