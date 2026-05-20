"use client";

import React from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";

interface GenerateStepProps {
  modules: ModuleResponseDto[];
  events: BuilderEvent[];
  onGenerate: () => void;
  isGenerating: boolean;
}

function getLinkedModule(moduleId: string, modules: ModuleResponseDto[]) {
  const found = modules.find((m) => String(m.moduleID) === moduleId);
  if (found) {
    return found;
  }
  return null;
}

function formatTime(start: string, end: string) {
  if (!start || !end) {
    return null;
  }
  return start + " - " + end;
}

export function GenerateStep({
  modules,
  events,
  onGenerate,
  isGenerating,
}: GenerateStepProps) {
  function renderModulesSummary() {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Modules
          </h3>
          <span className="text-sm text-[var(--text-secondary)]">
            {modules.length} module{modules.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {modules.map((module) => {
            return (
              <div
                key={module.moduleID}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
              >
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: module.styling || "var(--border)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base text-[var(--text-primary)] truncate">
                    {module.moduleName}
                  </p>
                  <p className="text-sm font-mono text-[var(--text-secondary)]">
                    {module.moduleCode}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderEventsSummary() {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Events
          </h3>
          <span className="text-sm text-[var(--text-secondary)]">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {events.map((event) => {
            const linkedModule = getLinkedModule(event.moduleId, modules);
            const timeString = formatTime(event.startTime, event.endTime);

            return (
              <div
                key={event.id}
                className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-medium text-[var(--text-primary)]">
                    {event.name}
                  </p>
                  <span className="text-sm font-mono text-[var(--text-secondary)] flex-shrink-0">
                    {event.code}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {event.date && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {event.date}
                    </p>
                  )}
                  {timeString && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {timeString}
                    </p>
                  )}
                  {linkedModule && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            linkedModule.styling || "var(--border)",
                        }}
                      />
                      <p className="text-sm font-mono text-[var(--text-secondary)]">
                        {linkedModule.moduleCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderLoadingState() {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-5 w-24 mt-2" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  function renderContent() {
    if (isGenerating) {
      return renderLoadingState();
    }

    return (
      <div className="flex flex-col gap-6">
        {renderModulesSummary()}
        <Separator className="bg-[var(--border)]" />
        {renderEventsSummary()}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Review and generate
        </h2>
        <p className="text-base text-[var(--text-secondary)] mt-1">
          Check your modules and events before generating your schedule.
        </p>
      </div>

      <div className="mb-8">{renderContent()}</div>

      <Button
        type="button"
        size="default"
        disabled={isGenerating}
        onClick={onGenerate}
        className="w-full text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
      >
        {isGenerating ? "Generating..." : "Generate schedule"}
      </Button>
    </div>
  );
}
