"use client";

import React from "react";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";
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
    "h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] " +
    "placeholder:text-[var(--text-secondary)] focus-visible:ring-1 focus-visible:ring-[var(--text-primary)] text-sm";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* header */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)]"
        style={{
          borderLeftWidth: "3px",
          borderLeftColor: module.colour || "var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Module {index + 1}
          </span>
          {module.code && (
            <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
              · {module.code}
            </span>
          )}
          {module.colour && (
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: module.colour }}
              aria-label={colourLabel}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(module.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          aria-label={`Remove module ${index + 1}`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* fields */}
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
        {/* module code */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`module-code-${module.id}`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Code
          </Label>
          <Input
            id={`module-code-${module.id}`}
            value={module.code}
            onChange={(e) => onUpdate(module.id, "code", e.target.value)}
            placeholder="Enter code here"
            maxLength={10}
            className={[inputClass, errors?.code ? "border-red-500" : ""].join(
              " ",
            )}
          />
          {errors?.code && (
            <p className="text-xs text-red-500">{errors.code}</p>
          )}
        </div>

        {/* module name */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`module-name-${module.id}`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Name
          </Label>
          <Input
            id={`module-name-${module.id}`}
            value={module.name}
            onChange={(e) => onUpdate(module.id, "name", e.target.value)}
            placeholder="Enter name here"
            className={[inputClass, errors?.name ? "border-red-500" : ""].join(
              " ",
            )}
          />
          {errors?.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* module colour */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs font-medium text-[var(--text-secondary)]">
            Colour
          </Label>
          <ColourPicker
            value={module.colour}
            onChange={(colour) => onUpdate(module.id, "colour", colour)}
          />
          {errors?.colour && (
            <p className="text-xs text-red-500">{errors.colour}</p>
          )}
        </div>
      </div>
    </div>
  );
}
