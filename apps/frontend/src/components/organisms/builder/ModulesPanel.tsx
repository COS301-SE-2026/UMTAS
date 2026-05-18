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
    onChange([...modules, { id: generateId(), name: trimmed, timeSlots: [] }]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  function handleRemoveModule(id: string) {
    onChange(modules.filter((m) => m.id !== id));
  }

  function handleAddSlot(moduleId: string) {
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, timeSlots: [...m.timeSlots, { ...EMPTY_SLOT }] }
          : m,
      ),
    );
  }

  function handleRemoveSlot(moduleId: string, idx: number) {
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, timeSlots: m.timeSlots.filter((_, i) => i !== idx) }
          : m,
      ),
    );
  }

  function handleUpdateSlot(moduleId: string, idx: number, slot: TimeSlot) {
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              timeSlots: m.timeSlots.map((s, i) => (i === idx ? slot : s)),
            }
          : m,
      ),
    );
  }

  function handleDone() {
    // Validate at least 1 module, every module has at least 1 fully-filled slot
    if (modules.length === 0) {
      setInputError("Add at least one module before continuing.");
      return;
    }
    const newErrors: Record<string, Record<number, string>> = {};
    let hasError = false;

    for (const mod of modules) {
      if (mod.timeSlots.length === 0) {
        newErrors[mod.id] = { 0: "Add at least one time slot." };
        hasError = true;
        continue;
      }
      for (let i = 0; i < mod.timeSlots.length; i++) {
        const s = mod.timeSlots[i];
        if (!s.day || !s.startTime || !s.endTime) {
          if (!newErrors[mod.id]) newErrors[mod.id] = {};
          newErrors[mod.id][i] = "Complete all fields for this slot.";
          hasError = true;
        }
      }
    }
    setSlotErrors(newErrors);
    if (!hasError) onDone();
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
            onClick={handleDone}
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
            {modules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onRemoveModule={handleRemoveModule}
                onAddTimeSlot={handleAddSlot}
                onRemoveTimeSlot={handleRemoveSlot}
                onUpdateTimeSlot={handleUpdateSlot}
                slotErrors={slotErrors[mod.id]}
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
