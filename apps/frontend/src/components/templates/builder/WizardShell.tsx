"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";
import { ModulesStep } from "@/components/organisms/builder/ModulesStep";
import { EventsStep } from "@/components/organisms/builder/EventsStep";

import { getAllModulesQ } from "./Queries/moduleQueries";
import { useQuery } from "@tanstack/react-query";
import { getAllEventsQ } from "./Queries/eventQueries";

const Steps = [{ label: "Modules" }, { label: "Events" }];

export function WizardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const {
    data: modules = [],
    isLoading: modLoading,
    isError: modError,
  } = useQuery(getAllModulesQ());
  const { data: Allevents = [] } = useQuery(getAllEventsQ());
  const events = Allevents.filter(
    (event) =>
      modules.some((mod) => mod.moduleID === event.eventCriteria.moduleId) ||
      event.eventCriteria.moduleId === "TEMP",
  );

  const [isInitialLoading, setIsInitialLoading] = useState(!!editId);

  function handleStepClick(index: number) {
    setCurrentStep(index);
  }

  function handleNext() {
    if (currentStep === Steps.length - 1) {
      //how we track between pages
      router.push("/schedules?action=new");
      return;
    }

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

  function getNextLabel() {
    if (currentStep === 0) return "Next: Events";
    if (currentStep === 1) return "Create Timetable";
    return "Generate";
  }

  function getBackHandler() {
    if (currentStep === 0) return undefined;
    return handleBack;
  }

  /*
  function isNextDisabled() {
    if (currentStep === 0) {
      const hasValidModule = modules.some(
        (m) => m.moduleCode && m.moduleName //&& m.styling,
      );
      return !hasValidModule;
    }
    if (currentStep === 1) {
      const hasValidEvent = events.some((e) => {
        const crit = e.event.eventCriteria;
        return (
          crit?.moduleCode &&
          crit?.day &&
          crit?.startTime &&
          crit?.endTime &&
          (crit.type !== "lecture" || e.lecture?.moduleID)
        );
      });
      return !hasValidEvent;
    }
    if (currentStep === 2) {
      return isGenerating;
    }
    return false;
  }
  */

  function renderStep() {
    if (currentStep === 0) {
      return <ModulesStep modules={modules} />;
    }
    if (currentStep === 1) {
      return (
        <EventsStep
          events={events}
          modules={modules}
          onGoToModules={() => setCurrentStep(0)}
        />
      );
    }
    return (
      <>
        <p
          onClick={() => {
            router.push("/schedules");
          }}
        >
          Generate step moved to schedules (temp message, this should not be
          visible)
        </p>
      </>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center p-20 text-[var(--text-secondary)]">
        Loading timetable
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] mx-4">
      <WizardStepper
        currentStep={currentStep}
        steps={Steps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />
      <div className="mx-auto flex flex-col w-full max-w-2xl mb-4">
        <WizardFooter
          onBack={getBackHandler()}
          onNext={handleNext}
          nextLabel={getNextLabel()}
          nextDisabled={false}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
        <div className="mx-auto w-full min-h-150 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
