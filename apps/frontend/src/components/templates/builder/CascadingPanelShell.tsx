"use client";

// Manages the cascading panel layout for the timetable builder.

/* Layout model:
    [ Left rail: StepPill list ]  [ Panel 1: Modules ]
*/

import React, { useState, useCallback } from "react";
import { BookOpen, SlidersHorizontal, ClipboardCheck } from "lucide-react";
import { StepPill } from "@/components/atoms/builder/StepPill";
import { ModulesPanel } from "@/components/organisms/builder/ModulesPanel";
import type { Module } from "@/components/molecules/builder/ModuleCard";
import { useRouter } from "next/navigation";

type OpenPanel = null | "modules" | "preferences" | "review";

function moduleSummary(modules: Module[]): string | undefined {
  if (modules.length === 0) return undefined;
  if (modules.length === 1) return modules[0].name;
  return `${modules[0].name} + ${modules.length - 1} more`;
}

export function CascadingPanelShell() {
  const router = useRouter();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesComplete, setModulesComplete] = useState(false);
  const [preferencesComplete, setPreferencesComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const openPanelFor = useCallback((panel: OpenPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }, []);

  function handleModulesDone() {
    setModulesComplete(true);
    setOpenPanel("preferences");
  }

  function panelStyle(panel: OpenPanel): React.CSSProperties {
    const isOpen = openPanel === panel;
    return {
      transform: isOpen ? "translateX(0)" : "translateX(8px)",
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
      transition:
        "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease",
    };
  }

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* Left rail */}
      <div className="flex w-64 flex-shrink-0 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2">
        {/* Header */}
        <div className="px-2 pb-2 pt-1">
          <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Build timetable
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Complete each step to generate your schedule.
          </p>
        </div>

        <div className="h-px bg-[var(--border)] mx-2" />

        <div className="flex flex-col gap-0.5 pt-1">
          {/* Step 1 Modules */}
          <StepPill
            icon={<BookOpen size={15} />}
            label="Modules"
            summary={moduleSummary(modules)}
            isActive={openPanel === "modules"}
            isComplete={modulesComplete}
            onClick={() => openPanelFor("modules")}
          />
        </div>
      </div>

      {/* Panels area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Empty state hint when no panel is open */}
        {openPanel === null && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                <BookOpen size={18} />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Select a step from the left to get started.
              </p>
            </div>
          </div>
        )}

        {/* Modules panel */}
        <div
          className="absolute inset-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
          style={panelStyle("modules")}
          aria-hidden={openPanel !== "modules"}
        >
          <ModulesPanel
            modules={modules}
            onChange={setModules}
            onClose={() => setOpenPanel(null)}
            onDone={handleModulesDone}
          />
        </div>
      </div>
    </div>
  );
}
