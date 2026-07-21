"use client";

import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import SolverUpload from "@/components/organisms/solver/SolverUpload";
import SolverReview from "@/components/organisms/solver/SolverReview";
import SolverPreferences from "@/components/organisms/solver/SolverPreferences";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { useState } from "react";
import { SolverLock } from "@/components/organisms/solver/SolverLock";

const events: EventResponse[] = [
  {
    eventCriteria: {
      date: "2026/06/07",
      endTime: "11:00",
      startTime: "10:00",
      moduleId: "301",
      eventSource: "university",
    },
    eventId: "1",
    isRecurring: false,
    activityCode: "COS301",
    eventName: "Software Engineering",
  },
  {
    eventCriteria: {
      date: "2026/06/07",
      endTime: "11:00",
      startTime: "10:00",
      moduleId: "332",
      eventSource: "university",
    },
    eventId: "2",
    isRecurring: false,
    activityCode: "COS332",
    eventName: "Networks",
  },
  {
    eventCriteria: {
      date: "2026/06/07",
      endTime: "10:00",
      startTime: "9:00",
      moduleId: "333",
      eventSource: "university",
    },
    eventId: "3",
    isRecurring: false,
    activityCode: "COS333",
    eventName: "Programming Languages",
  },
];

const modules: ModuleResponseDto[] = [
  {
    moduleCode: "301",
    moduleID: "COS301",
    moduleName: "Software Engineering",
    moduleDescription: "",
    ModuleGroupingID: "",
    styling: { colour: "blue" },
  },
  {
    moduleCode: "332",
    moduleID: "COS332",
    moduleName: "Networks",
    moduleDescription: "",
    ModuleGroupingID: "",
    styling: { colour: "red" },
  },
  {
    moduleCode: "333",
    moduleID: "COS333",
    moduleName: "Programming Languages",
    moduleDescription: "",
    ModuleGroupingID: "",
    styling: { colour: "green" },
  },
];

export default function SolverShell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [comingFromStep, setComingFromStep] = useState<number | null>(null);

  function handleStepCompleted(fromStep: number) {
    setComingFromStep(fromStep);
    setCompletedSteps((previous) => [...previous, fromStep]);

    //the actual async call should happen here wilmar instead of a timeout
    setTimeout(() => {
      setCurrentStep(fromStep + 1);
      setComingFromStep(null);
    }, 676);
  }
  return (
    <>
      <WizardStepper
        completedSteps={completedSteps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        steps={[
          { label: "Upload" },
          { label: "Review" },
          { label: "Preferences" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-10xl mx-auto px-6 pt-6">
        <div className="flex justify-center h-fit">
          <SolverUpload onComplete={() => handleStepCompleted(0)} />
        </div>

        <div className="flex justify-center h-fit">
          <SolverLock locked={currentStep < 1} loading={comingFromStep === 0}>
            <SolverReview
              events={events}
              modules={modules}
              onComplete={() => handleStepCompleted(1)}
            />
          </SolverLock>
        </div>

        <div className="flex justify-center">
          <SolverLock locked={currentStep < 2} loading={comingFromStep === 1}>
            <SolverPreferences />
          </SolverLock>
        </div>
      </div>
    </>
  );
}
