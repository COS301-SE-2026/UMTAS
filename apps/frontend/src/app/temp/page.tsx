"use client";
import React from "react";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";
import {
  EventCard,
  BuilderEvent,
} from "@/components/molecules/builder/EventCard";
import { ModuleCard, Module } from "@/components/molecules/builder/ModuleCard";

const Steps = [
  { label: "Modules" },
  { label: "Events" },
  { label: "Generate" },
];

const mockModule: Module = {
  id: "mod11",
  code: "COS301",
  name: "Software Engineering",
  colour: "blue",
};

const mockEvent: BuilderEvent = {
  id: "ev1",
  name: "COS301 Lecture Group A",
  code: "COS301-LEC-A",
  date: "2026-05-19",
  startTime: "08:30",
  endTime: "10:00",
  type: "lecture",
  moduleId: "mod-1",
};

export default function temp() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);

  function handleNext() {
    if (currentStep < Steps.length - 1) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleStepClick(index: number) {
    setCurrentStep(index);
  }

  function getNextLabel() {
    if (currentStep === 0) return "Next: Events";
    if (currentStep === 1) return "Next: Generate";
    return "Generate";
  }

  function renderBack() {
    if (currentStep === 0) return undefined;
    return handleBack;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      <WizardStepper
        currentStep={currentStep}
        steps={Steps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />
      <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col gap-4 justify-center">
        <p className="text-sm font-semibold text-[var(--text-secondary)] text-center mb-2">
          Step {currentStep + 1} {Steps[currentStep].label}
        </p>

        {currentStep === 0 && (
          <ModuleCard
            module={mockModule}
            index={0}
            onUpdate={(id, field, val) =>
              console.log("Update Module:", field, val)
            }
            onRemove={(id) => console.log("Remove Module:", id)}
          />
        )}

        {currentStep === 1 && (
          <EventCard
            event={mockEvent}
            index={0}
            modules={[mockModule]}
            onUpdate={(id, field, val) =>
              console.log("Update Event:", field, val)
            }
            onRemove={(id) => console.log("Remove Event:", id)}
            onGoToModules={() => setCurrentStep(0)}
          />
        )}
      </div>

      <WizardFooter
        onBack={renderBack()}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        nextDisabled={false}
      />
    </div>
  );
}
