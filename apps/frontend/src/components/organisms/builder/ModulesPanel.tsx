"use client";

// modules cascading panel. Lets the student add module codes/names

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Button } from "@/components/atoms/baseShadcn/button";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import {
  ModuleCard,
  type Module,
} from "@/components/molecules/builder/ModuleCard";
import type { TimeSlot } from "@/components/atoms/builder/TimeSlotSelect";

interface ModulesPanelProps {
  modules: Module[];
  onChange: (modules: Module[]) => void;
  onClose: () => void;
  onDone: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const EMPTY_SLOT: TimeSlot = { day: "", startTime: "", endTime: "" };

export function ModulesPanel({
  modules,
  onChange,
  onClose,
  onDone,
}: ModulesPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [slotErrors, setSlotErrors] = useState<
    Record<string, Record<number, string>>
  >({});

  function handleAdd() {
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) {
      setInputError("Enter a module code or name.");
      return;
    }
    if (modules.some((m) => m.name === trimmed)) {
      setInputError("Module already added.");
      return;
    }
    setInputError("");
    setInputValue("");
    onChange([
      ...modules,
      {
        id: generateId(),
        code: "",
        name: trimmed,
        colour: "",
        description: "",
      },
    ]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  function handleRemove(id: string) {
    onChange(modules.filter((m) => m.id !== id));
  }

  function handleUpdate(
    id: string,
    field: keyof Omit<Module, "id" | "timeSlots">,
    value: string,
  ) {
    onChange(modules.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title="Modules"
        onClose={onClose}
        action={
          <Button
            type="button"
            size="sm"
            disabled={modules.length === 0}
            className="h-7 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90"
          >
            Done
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Module input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Add module
          </label>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. COS301"
              className="h-9 flex-1 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)] focus-visible:ring-1 focus-visible:ring-[var(--text-primary)]"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className="h-9 px-3 bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90"
            >
              <Plus size={14} />
            </Button>
          </div>
          {inputError && <p className="text-xs text-red-500">{inputError}</p>}
        </div>

        {/* Module cards */}
        {modules.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              {modules.length} module{modules.length !== 1 ? "s" : ""}
            </p>
            {modules.map((mod, index) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={index}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                errors={slotErrors[mod.id]}
              />
            ))}
          </div>
        )}

        {modules.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
              <Plus size={18} />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              No modules added yet.
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Type a module code above and press Enter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
