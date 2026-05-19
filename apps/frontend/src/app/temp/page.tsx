"use client";
import React from "react";
import { ModulesStep } from "@/components/organisms/builder/ModulesStep";
import { EventsStep } from "@/components/organisms/builder/EventsStep";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";
import type { Module } from "@/components/molecules/builder/ModuleCard";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";
import type { EventType } from "@/components/atoms/builder/eventDropdown";

const Steps = [
  { label: "Modules" },
  { label: "Events" },
  { label: "Generate" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function temp() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [events, setEvents] = React.useState<BuilderEvent[]>([]);

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

  function getBackHandler() {
    if (currentStep === 0) return undefined;
    return handleBack;
  }

  function handleModuleAdd() {
    setModules((prev) => [
      ...prev,
      { id: generateId(), code: "", name: "", colour: "" },
    ]);
  }

  function handleModuleUpdate(
    id: string,
    field: keyof Omit<Module, "id">,
    value: string,
  ) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, [field]: value };
        return m;
      }),
    );
  }

  function handleModuleRemove(id: string) {
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  function handleEventAdd() {
    setEvents((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        code: "",
        date: "",
        startTime: "",
        endTime: "",
        type: "lecture" as EventType,
        moduleId: "",
      },
    ]);
  }

  function handleEventUpdate(
    id: string,
    field: keyof Omit<BuilderEvent, "id">,
    value: string,
  ) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) return { ...e, [field]: value };
        return e;
      }),
    );
  }

  function handleEventRemove(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function renderStep() {
    if (currentStep === 0) {
      return (
        <ModulesStep
          modules={modules}
          onAdd={handleModuleAdd}
          onUpdate={handleModuleUpdate}
          onRemove={handleModuleRemove}
          onNavigateAway={() => setCurrentStep(1)}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <EventsStep
          events={events}
          modules={modules}
          onAdd={handleEventAdd}
          onUpdate={handleEventUpdate}
          onRemove={handleEventRemove}
          onGoToModules={() => setCurrentStep(0)}
        />
      );
    }

    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-base text-[var(--text-secondary)]">
          Generate step coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      <WizardStepper
        currentStep={currentStep}
        steps={Steps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl">{renderStep()}</div>
      </div>

      <WizardFooter
        onBack={getBackHandler()}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        nextDisabled={false}
      />
    </div>
  );
}
