"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";
import { ModulesStep } from "@/components/organisms/builder/ModulesStep";
import { EventsStep } from "@/components/organisms/builder/EventsStep";
import { GenerateStep } from "@/components/organisms/builder/GenerateStep";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";
import type { EventType } from "@/components/atoms/builder/eventDropdown";
import {
  createModulesBuilder,
  getAllModulesBuilder,
} from "@/app/builder/utils/modules/requestBuilders";

const Steps = [
  { label: "Modules" },
  { label: "Events" },
  { label: "Generate" },
];

function generateId(): string {
  const crypto = window.crypto;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  return array[0].toString();
}

function emptyModule(): ModuleResponseDto {
  return {
    moduleID: Number(generateId()),
    moduleCode: "",
    moduleName: "",
    styling: "",
    userID: "",
  };
}

function emptyEvent(): BuilderEvent {
  return {
    id: generateId(),
    name: "",
    code: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "lecture" as EventType,
    moduleId: "",
    isRecurring: false,
  };
}

export function WizardShell() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [modules, setModules] = useState<ModuleResponseDto[]>([]);
  const [events, setEvents] = useState<BuilderEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleModuleAdd() {
    try {
      const nextNum = modules.length + 1;
      const builder = new createModulesBuilder();
      await builder.send({
        body: {
          code: `MOD-${nextNum}`,
          name: `Module ${nextNum}`,
          styling: "#3B82F6",
        },
      });
    } catch (error) {
      console.error("Failed to create module:", error);
    }
  }

  function handleModuleUpdate(
    id: number,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID">,
    value: string,
  ) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.moduleID === id) {
          return { ...m, [field]: value };
        }
        return m;
      }),
    );
  }

  function handleModuleRemove(id: number) {
    setModules((prev) => prev.filter((m) => m.moduleID !== id));
  }

  function handleEventAdd() {
    setEvents((prev) => [...prev, emptyEvent()]);
  }

  function handleEventUpdate(
    id: string,
    field: keyof Omit<BuilderEvent, "id">,
    value: string,
  ) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return { ...e, [field]: value };
        }
        return e;
      }),
    );
  }

  function handleEventRemove(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleStepClick(index: number) {
    setCurrentStep(index);
  }

  function handleNext() {
    if (currentStep < Steps.length - 1) {
      setCompletedSteps((prev) => {
        if (prev.includes(currentStep)) {
          return prev;
        }
        return [...prev, currentStep];
      });
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    localStorage.setItem("umtas-schedule-modules", JSON.stringify(modules));
    localStorage.setItem("umtas-schedule-events", JSON.stringify(events));
    await new Promise((res) => setTimeout(res, 2500));
    router.push("/schedules");
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

  function isNextDisabled() {
    if (currentStep === 0) {
      const hasValidModule = modules.some(
        (m) => m.moduleCode && m.moduleName && m.styling,
      );
      return !hasValidModule;
    }
    if (currentStep === 1) {
      const hasValidEvent = events.some(
        (e) =>
          e.name && e.code && e.date && e.startTime && e.endTime && e.moduleId,
      );
      return !hasValidEvent;
    }
    if (currentStep === 2) {
      return isGenerating;
    }
    return false;
  }
  useEffect(() => {
    if (currentStep === 0) {
      const fetchModules = async () => {
        try {
          const builder = new getAllModulesBuilder();
          const response = await builder.send({});
          setModules(response.modules);
        } catch (error) {
          console.error("Failed to fetch modules:", error);
        }
      };
      fetchModules();
    }
  }, [currentStep]);

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
      <GenerateStep
        modules={modules}
        events={events}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      <WizardStepper
        currentStep={currentStep}
        steps={Steps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="flex-1 overflow-y-auto bg-[var(--bg-base)] px-6 py-20">
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]">
          {renderStep()}
        </div>
      </div>

      <WizardFooter
        onBack={getBackHandler()}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        nextDisabled={isNextDisabled()}
      />
    </div>
  );
}
