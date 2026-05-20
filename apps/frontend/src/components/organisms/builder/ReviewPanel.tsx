"use client";

// Shows a read-only summary
// of modules and preferences then fires the solver on confirmation.
/*
import React from "react";
import {
  BookOpen,
  CalendarDays,
  Clock,
  Layers,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import { GeneratingSkeleton } from "@/components/atoms/builder/GeneratingSkeleton";
import { ReviewSummaryItem } from "@/components/molecules/builder/ReviewSummaryItem";
import type { Module } from "@/components/molecules/builder/ModuleCard";
import type { Preferences } from "@/components/organisms/builder/PreferencesPanel";

interface ReviewPanelProps {
  modules: Module[];
  preferences: Preferences;
  isGenerating: boolean;
  onGenerate: () => void;
  onClose: () => void;
  onEditModules: () => void;
  onEditPreferences: () => void;
}

function buildPreferenceSummary(prefs: Preferences): string {
  const parts: string[] = [];

  if (prefs.preferredDays.length > 0 && prefs.preferredDays.length < 5) {
    parts.push(prefs.preferredDays.map((d) => d.slice(0, 3)).join(", "));
  } else {
    parts.push("Any day");
  }

  const timeLabels: Record<Preferences["timeOfDay"], string> = {
    morning: "morning classes",
    midday: "midday classes",
    afternoon: "afternoon classes",
    any: "no time preference",
  };
  parts.push(timeLabels[prefs.timeOfDay]);

  if (prefs.compactGaps) parts.push("compact gaps");
  if (prefs.fewerDays) parts.push("fewer days on campus");

  return parts.join(" · ");
}

function buildModuleSummary(modules: Module[]): string {
  const total = modules.reduce((acc, m) => acc + m.timeSlots.length, 0);
  return `${modules.map((m) => m.name).join(", ")} - ${total} slot${total !== 1 ? "s" : ""} total`;
}

export function ReviewPanel({
  modules,
  preferences,
  isGenerating,
  onGenerate,
  onClose,
  onEditModules,
  onEditPreferences,
}: ReviewPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="Review & Generate" onClose={onClose} />

      <div className="flex-1 overflow-y-auto p-4">
        {isGenerating ? (
          <GeneratingSkeleton />
        ) : (
          <div className="space-y-4">
            {/* Summary cards }
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4">
              <ReviewSummaryItem
                icon={<BookOpen size={14} />}
                label="Modules"
                value={buildModuleSummary(modules)}
                onEdit={onEditModules}
              />
              <ReviewSummaryItem
                icon={<CalendarDays size={14} />}
                label="Preferences"
                value={buildPreferenceSummary(preferences)}
                onEdit={onEditPreferences}
              />
              <ReviewSummaryItem
                icon={<Layers size={14} />}
                label="Gap density"
                value={
                  preferences.compactGaps
                    ? "Compact - minimal gaps"
                    : "Relaxed - gaps allowed"
                }
              />
              <ReviewSummaryItem
                icon={<LayoutGrid size={14} />}
                label="Day consolidation"
                value={
                  preferences.fewerDays
                    ? "Fewer days on campus"
                    : "Spread across the week"
                }
              />
            </div>

            {/* Per module slot detail }
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Module detail
              </p>
              <div className="space-y-2">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
                  >
                    <p className="mb-1.5 font-mono text-xs font-medium text-[var(--text-primary)]">
                      {mod.name}
                    </p>
                    {mod.timeSlots.map((slot, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 py-0.5 text-xs text-[var(--text-secondary)]"
                      >
                        <Clock size={11} className="flex-shrink-0" />
                        <span>
                          {slot.day} {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate button }
            <Button
              type="button"
              onClick={onGenerate}
              className="w-full gap-2 bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 h-10"
            >
              <Zap size={15} />
              Generate my schedules
            </Button>

            <p className="text-center text-xs text-[var(--text-secondary)]">
              The solver will return up to 3 ranked, conflict-free options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
*/
