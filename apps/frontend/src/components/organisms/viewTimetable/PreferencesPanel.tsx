"use client";

// Student sets preferred days,

import React from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/atoms/baseShadcn/toggle-group";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import { PreferenceRow } from "@/components/molecules/viewTimetable/PreferenceRow";

export interface Preferences {
  preferredDays: string[];
  timeOfDay: "morning" | "midday" | "afternoon" | "any";
  compactGaps: boolean;
  fewerDays: boolean;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_VALUES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_OPTIONS: { value: Preferences["timeOfDay"]; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "any", label: "Any" },
];

interface PreferencesPanelProps {
  preferences: Preferences;
  onChange: (prefs: Preferences) => void;
  onClose: () => void;
  onDone: () => void;
}

export function PreferencesPanel({
  preferences,
  onChange,
  onClose,
  onDone,
}: PreferencesPanelProps) {
  function setDays(days: string[]) {
    onChange({ ...preferences, preferredDays: days });
  }

  const toggleClass =
    "h-8 px-3 text-xs border border-[var(--border)] rounded-md data-[state=on]:bg-[var(--text-primary)] data-[state=on]:text-[var(--bg-base)] data-[state=on]:border-[var(--text-primary)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors";

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title="Preferences"
        onClose={onClose}
        action={
          <Button
            type="button"
            size="sm"
            onClick={onDone}
            className="h-7 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90"
          >
            Done
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-0 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] divide-y-0 px-4">
          {/* Preferred days */}
          <PreferenceRow
            label="Preferred days"
            description="Which days are you happy to attend?"
            stacked
          >
            <ToggleGroup
              type="multiple"
              value={preferences.preferredDays}
              onValueChange={setDays}
              className="flex flex-wrap gap-1.5"
            >
              {DAYS.map((d, i) => (
                <ToggleGroupItem
                  key={d}
                  value={DAY_VALUES[i]}
                  className={toggleClass}
                  aria-label={DAY_VALUES[i]}
                >
                  {d}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PreferenceRow>

          {/* Time of day */}
          <PreferenceRow
            label="Preferred time of day"
            description="When would you prefer classes to be scheduled?"
            stacked
          >
            <ToggleGroup
              type="single"
              value={preferences.timeOfDay}
              onValueChange={(v) =>
                v &&
                onChange({
                  ...preferences,
                  timeOfDay: v as Preferences["timeOfDay"],
                })
              }
              className="flex flex-wrap gap-1.5"
            >
              {TIME_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className={toggleClass}
                  aria-label={opt.label}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PreferenceRow>

          {/* Compact gaps */}
          <PreferenceRow
            label="Compact schedule"
            description="Minimise gaps between classes."
          >
            <Switch
              checked={preferences.compactGaps}
              onCheckedChange={(v) =>
                onChange({ ...preferences, compactGaps: v })
              }
              className="data-[state=checked]:bg-[var(--text-primary)]"
            />
          </PreferenceRow>

          {/* Fewer days */}
          <PreferenceRow
            label="Fewer days on campus"
            description="Consolidate classes onto as few days as possible."
          >
            <Switch
              checked={preferences.fewerDays}
              onCheckedChange={(v) =>
                onChange({ ...preferences, fewerDays: v })
              }
              className="data-[state=checked]:bg-[var(--text-primary)]"
            />
          </PreferenceRow>
        </div>
      </div>
    </div>
  );
}
