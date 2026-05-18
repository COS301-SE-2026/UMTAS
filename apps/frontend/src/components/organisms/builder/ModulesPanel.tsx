"use client";

import React from "react";
import { Plus, BookOpen } from "lucide-react";
import { type Module } from "@/components/molecules/builder/ModuleCard";

interface ModulesPanelProps {
  modules: Module[];
  onClose: () => void;
  onAdd: () => void;
  selectedModuleId: string | null;
  onModuleSelect: (id: string) => void;
}

export function ModulesPanel({
  modules,
  onClose,
  onAdd,
  selectedModuleId,
  onModuleSelect,
}: ModulesPanelProps) {
  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
          <Plus size={18} />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">No modules yet.</p>
        <p className="text-xs text-[var(--text-secondary)]">
          Click below to add one.
        </p>
      </div>
    );
  }

  function renderModulePills() {
    return (
      <div className="space-y-1">
        {modules.map((module, index) => (
          <StepPill
            key={module.id}
            icon={<BookOpen size={15} />}
            label={module.name || "Module " + (index + 1)}
            summary={module.code || undefined}
            isActive={selectedModuleId === module.id}
            isComplete={!!(module.code && module.name && module.colour)}
            onClick={() => onModuleSelect(module.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="Modules" onClose={onClose} />

      <div className="px-3 py-2 border-b border-[var(--border)]">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {modules.length === 0 ? renderEmptyState() : renderModulePills()}

        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
            <Plus size={15} />
          </span>
          Add module
        </button>
      </div>
    </div>
  );
}
