"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/../utilities/utils";

interface WizardStepperProps {
  currentStep: number;
  steps: { label: string }[];
  completedSteps: number[];
  onStepClick: (index: number) => void;
}

export function WizardStepper({
  currentStep,
  steps,
  completedSteps,
  onStepClick,
}: WizardStepperProps) {
  function isCompleted(index: number) {
    return completedSteps.includes(index);
  }

  function isCurrent(index: number) {
    return index === currentStep;
  }

  function handleClick(index: number) {
    if (isCompleted(index)) {
      onStepClick(index);
    }
  }

  function getCircleClass(index: number) {
    if (isCompleted(index)) {
      return "bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]";
    }
    if (isCurrent(index)) {
      return "bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--text-primary)]";
    }
    return "bg-[var(--bg-base)] text-[var(--text-disabled)] border-[var(--border)]";
  }

  function getLabelClass(index: number) {
    if (isCurrent(index)) {
      return "text-[var(--text-primary)] font-semibold";
    }
    if (isCompleted(index)) {
      return "text-[var(--text-primary)] font-medium";
    }
    return "text-[var(--text-disabled)]";
  }

  function getConnectorClass(index: number) {
    if (isCompleted(index)) {
      return "bg-[var(--text-primary)]";
    }
    return "bg-[var(--border)]";
  }

  return (
    <div className="flex items-center px-8 py-3 border-b border-[var(--border)] bg-[var(--bg-base)]">
      {steps.map((step, index) => {
        const isClickable = isCompleted(index);

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => handleClick(index)}
                className={cn(
                  "h-9 w-9 rounded-full border-2 flex items-center justify-center",
                  "transition-all duration-[var(--duration-normal)]",
                  getCircleClass(index),
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default",
                )}
                aria-label={"Go to step " + step.label}
                aria-current={isCurrent(index) ? "step" : undefined}
              >
                {isCompleted(index) && <Check size={16} strokeWidth={1.5} />}
                {!isCompleted(index) && (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>

              <span
                className={cn(
                  "text-sm whitespace-nowrap transition-colors duration-[var(--duration-normal)]",
                  getLabelClass(index),
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-3 mb-5 rounded-full transition-colors duration-[var(--duration-normal)]",
                  getConnectorClass(index),
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
