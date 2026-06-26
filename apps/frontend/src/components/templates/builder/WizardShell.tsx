"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";
import { ModulesStep } from "@/components/organisms/builder/ModulesStep";
import { EventsStep } from "@/components/organisms/builder/EventsStep";
import { GenerateStep } from "@/components/organisms/builder/GenerateStep";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { getAllModulesBuilder } from "@/app/builder/utils/modules/requestBuilders";
import {
  getAllEventsBuilder,
  createEventsBuilder,
  deleteEventById,
  updateEventByID,
  type EventResponse,
} from "@/app/builder/utils/events/eventRequestBuilder";
import {
  createTimeTableBuilder,
  getTTbyIdBuilder,
  updateTTbyIDBuilder,
} from "@/app/builder/utils/timetables/TimeTableRequests";

import { getAllModulesQ } from "./Queries/moduleQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { useQuery } from "@tanstack/react-query";

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

  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventsTrigger, setEventsTrigger] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(!!editId);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [OGeventId, setOGeventId] = useState<string[]>([]);
  const [timetableName, setTimetableName] = useState("My New Schedule");

  function handleEventAdd() {
    const newEventId = Number(generateId());
    setEvents((prev) => [
      ...prev,
      {
        event: {
          eventID: newEventId,
          userID: "",
          name: "",
          code: "",
          eventCriteria: {
            day: "",
            startTime: "",
            endTime: "",
            type: "lecture",
            moduleCode: "",
            venue: "",
          },
          isRecurring: false,
        },
      },
    ]);
  }

  async function handleEventUpdate(
    id: number,
    field: string,
    value: string | boolean,
  ) {
    if (field === "confirm") {
      const targetEvent = events.find((e) => e.event.eventID === id);
      if (!targetEvent) return;

      try {
        const payload = {
          name: targetEvent.event.name,
          code: targetEvent.event.code,
          eventCriteria: {
            day: targetEvent.event.eventCriteria.day,
            startTime: targetEvent.event.eventCriteria.startTime,
            endTime: targetEvent.event.eventCriteria.endTime,
            type: targetEvent.event.eventCriteria.type || "lecture",
            moduleCode: targetEvent.event.eventCriteria.moduleCode,
            venue: targetEvent.event.eventCriteria.venue,
          },
          isRecurring: targetEvent.event.isRecurring || false,
        };

        if (!targetEvent.event.userID) {
          const builder = new createEventsBuilder();
          await builder.send({ body: payload });
        } else {
          const builder = new updateEventByID();
          await builder.send({
            paths: { id },
            body: payload,
          });
        }
        setEventsTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to update/create event:", error);
      }
      return;
    }

    setEvents((prev) =>
      prev.map((e) => {
        if (e.event.eventID === id) {
          if (field === "name" || field === "code") {
            return {
              ...e,
              event: {
                ...e.event,
                [field]: value,
              },
            };
          }

          if (field === "moduleId") {
            const selectedModule = modules.find(
              (m) => m.moduleID === Number(value),
            );
            return {
              ...e,
              event: {
                ...e.event,
                eventCriteria: {
                  ...e.event.eventCriteria,
                  moduleCode: selectedModule?.moduleCode || "",
                },
              },
              lecture: {
                ...e.lecture,
                lectureID: e.lecture?.lectureID || 0,
                eventID: id,
                moduleID: Number(value),
              },
            };
          }

          const fieldMap: Record<string, string> = {
            date: "day",
          };
          const criteriaField = fieldMap[field] || field;

          return {
            ...e,
            event: {
              ...e.event,
              eventCriteria: {
                ...e.event.eventCriteria,
                [criteriaField]: value,
              },
            },
          };
        }
        return e;
      }),
    );
  }

  async function handleEventRemove(id: number) {
    const targetEvent = events.find((e) => e.event.eventID === id);
    if (targetEvent && !targetEvent.event.userID) {
      setEvents((prev) => prev.filter((e) => e.event.eventID !== id));
      return;
    }

    try {
      const builder = new deleteEventById();
      await builder.send({
        paths: { id },
      });
      setEventsTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
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
  async function handleGenerate(name: string, selectedEventIds: number[]) {
    setIsGenerating(true);
    try {
      const finalEvents = selectedEventIds.map((id) =>
        parseInt(String(id), 10),
      );

      if (editId) {
        const noNumIds = OGeventId.map(Number).filter(
          (id) => !selectedEventIds.includes(id),
        );

        const numbersOnlyAddIds = selectedEventIds.filter(
          (id) => !OGeventId.map(Number).includes(id),
        );

        const builder = new updateTTbyIDBuilder();
        await builder.send({
          paths: { id: Number(editId) },
          body: {
            timetableName: name || "Updated Schedule",
            removeEventIds: noNumIds,
            addEventIds: numbersOnlyAddIds,
          },
        });
      } else {
        const builder = new createTimeTableBuilder();
        await builder.send({
          body: {
            timetableName: name || "Generated Schedule",
            eventIds: finalEvents,
          },
        });
      }

      window.location.href = "/schedules";
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

  function isNextDisabled() {
    if (currentStep === 0) {
      const hasValidModule = modules.some(
        (m) => m.moduleCode && m.moduleName && m.styling,
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

  useEffect(() => {
    if (currentStep === 1 || editId) {
      const fetchEvents = async () => {
        try {
          const builder = new getAllEventsBuilder();
          const response = await builder.send({});
          setEvents(response.events);

          if (!editId) {
            setSelectedEventIds(response.events.map((e) => e.event.eventID));
          }
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      };
      fetchEvents();
    }
  }, [currentStep, eventsTrigger, editId]);

  useEffect(() => {
    if (!editId) return;

    async function loadAllEditData() {
      try {
        const [timetableRes, modulesRes, eventsRes] = await Promise.all([
          //prevents opening on step 0 (modules)
          new getTTbyIdBuilder().send({
            paths: { id: editId as unknown as number },
          }),
          new getAllModulesBuilder().send({}),
          new getAllEventsBuilder().send({}),
        ]);

        getQueryClient().setQueryData(
          getAllModulesQ().queryKey,
          modulesRes.modules,
        );

        setEvents(eventsRes.events);

        setTimetableName(
          timetableRes.timetable.timetableName || "Updated Schedule",
        );

        setOGeventId((timetableRes.eventIds || []).map(String));
        setSelectedEventIds((timetableRes.eventIds || []).map(Number));

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
        nextDisabled={isNextDisabled()}
      />
    </div>
  );
}
