"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";
import { ModulesStep } from "@/components/organisms/builder/ModulesStep";
import { EventsStep } from "@/components/organisms/builder/EventsStep";
import { GenerateStep } from "@/components/organisms/builder/GenerateStep";

import {
  addTimetableMut,
  updateTimetableMut,
  getTimetableByIdQ
} from "./Queries/timetableQueries";
import { useMutation } from "@tanstack/react-query";

import { getAllModulesQ } from "./Queries/moduleQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { useQuery } from "@tanstack/react-query";
import { getAllEventsQ } from "./Queries/eventQueries";

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
  const { data: events = [] } = useQuery(getAllEventsQ());
  const { mutateAsync: addTimetable } = useMutation(addTimetableMut());
  const { mutateAsync: updateTimetable } = useMutation(updateTimetableMut());

  const [isGenerating, setIsGenerating] = useState(false);

  const [isInitialLoading, setIsInitialLoading] = useState(!!editId);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [OGeventId, setOGeventId] = useState<string[]>([]);
  const [timetableName, setTimetableName] = useState("My New Schedule");

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
  async function handleGenerate(name: string, selectedEventIds: string[]) {
    setIsGenerating(true);
    try {
      const finalEvents = selectedEventIds.map((id) => id);

      if (editId) {
        const noNumIds = OGeventId.filter(
          (id) => !selectedEventIds.includes(id),
        );

        const numbersOnlyAddIds = selectedEventIds.filter(
          (id) => !OGeventId.includes(id),
        );

        await updateTimetable({
          path: { id: editId },
          body: {
            timetableName: name || "Updated Schedule",
            removeEventIds: noNumIds,
            addEventIds: numbersOnlyAddIds,
          },
        });
      } else {
        await addTimetable({
          body: {
            timetableName: name || "Generated Schedule",
            eventIds: finalEvents,
          },
        });
      }

      router.push("/schedules");
    } catch (error) {
      console.error("Failed to generate timetable:", error);
      setIsGenerating(false);
    }
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

  useEffect(() => {
    if (!editId) return;

    async function loadAllEditData() {
      try {
        const queryClient = getQueryClient();

        const [timetableRes, modulesData, eventsData] = await Promise.all([
          queryClient.fetchQuery(getTimetableByIdQ(editId!)),
          queryClient.fetchQuery(getAllModulesQ()),
          queryClient.fetchQuery(getAllEventsQ()),
        ]);

        setTimetableName(
          timetableRes.timetable.timetableName || "Updated Schedule",
        );

        setOGeventId((timetableRes.eventIds || []).map(String));
        setSelectedEventIds((timetableRes.eventIds || []).map(String));

        setCompletedSteps([0, 1]);
        setCurrentStep(2);
      } catch (error) {
        console.error("Failed to load timetable dataset for editing:", error);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadAllEditData();
  }, [editId]);

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
      <GenerateStep
        modules={modules}
        events={events}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        isEditMode={!!editId}
        timetableName={timetableName}
        setTimetableName={setTimetableName}
        selectedEventIds={selectedEventIds}
        setSelectedEventIds={setSelectedEventIds}
      />
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
        nextDisabled={false}
      />
    </div>
  );
}
