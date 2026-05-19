"use client";

import React from "react";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  ColourPicker,
  Module_Colours,
} from "@/components/atoms/builder/colourPicker";

export interface Module {
  id: string;
  code: string;
  name: string;
  colour: string;
}

export interface ModuleErrors {
  code?: string;
  name?: string;
  colour?: string;
}

interface ModuleCardProps {
  module: Module;
  index: number;
  onUpdate: (
    id: string,
    field: keyof Omit<Module, "id">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
  errors?: ModuleErrors;
}

export function ModuleCard({
  module,
  index,
  onUpdate,
  onRemove,
  errors,
}: ModuleCardProps) {
  const colourLabel =
    Module_Colours.find((c) => c.value === module.colour)?.label ?? "None";

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
            htmlFor={"module-code-" + module.id}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Code
          </Label>
          <Input
            id={"module-code-" + module.id}
            value={module.code}
            onChange={(e) => onUpdate(module.id, "code", e.target.value)}
            placeholder="e.g. COS301"
            maxLength={10}
            className={getInputClass(!!errors?.code)}
          />
          {errors?.code && (
            <p className="text-sm text-[var(--error-text)]">{errors.code}</p>
          )}
        </div>

        {/* module name */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"module-name-" + module.id}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Name
          </Label>
          <Input
            id={"module-name-" + module.id}
            value={module.name}
            onChange={(e) => onUpdate(module.id, "name", e.target.value)}
            placeholder="e.g. Software Engineering"
            className={getInputClass(!!errors?.name)}
          />
          {errors?.name && (
            <p className="text-sm text-[var(--error-text)]">{errors.name}</p>
          )}
        </div>

        {/* module colour */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label className="text-sm font-medium text-[var(--text-secondary)]">
            Colour
          </Label>
          <ColourPicker
            value={module.colour}
            onChange={(colour) => onUpdate(module.id, "colour", colour)}
          />
          {errors?.colour && (
            <p className="text-sm text-[var(--error-text)]">{errors.colour}</p>
          )}
        </div>
      </div>
    </div>
  );
}
