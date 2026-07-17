"use client";

import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import SolverUpload from "@/components/organisms/solver/SolverUpload";
import SolverReview from "@/components/organisms/solver/SolverReview";
import SolverPreferences from "@/components/organisms/solver/SolverPreferences";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";

const events: EventResponse[] = [
  {
    eventCriteria: {
      date: "2026/06/07",
      endTime: "9:00",
      startTime: "10:00",
      moduleID: "301",
      type: "university",
      venue: "IT-2-26",
    },
    eventID: "1",
    isRecurring: false,
    eventCode: "COS301",
    eventName: "Software Engineering",
  },
  {
    eventCriteria: {
      date: "2026/06/07",
      endTime: "9:00",
      startTime: "10:00",
      moduleID: "332",
      type: "university",
      venue: "IT-2-27",
    },
    eventID: "2",
    isRecurring: false,
    eventCode: "COS332",
    eventName: "Networks",
  },
  {
    eventCriteria: {
      date: "2026/06/07",
      endTime: "9:00",
      startTime: "10:00",
      moduleID: "333",
      type: "university",
      venue: "IT-2-24",
    },
    eventID: "3",
    isRecurring: false,
    eventCode: "COS333",
    eventName: "Software Engineering",
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
  return (
    <>
      <WizardStepper
        completedSteps={[]}
        currentStep={0}
        onStepClick={() => {}}
        steps={[
          { label: "Upload" },
          { label: "Review" },
          { label: "Preferences" },
        ]}
      />
      <div className="flex flex-row items-center justify-between">
        <div>
          <SolverUpload />
        </div>
        <div>
          <SolverReview events={events} modules={modules} />
        </div>
        <div>
          <SolverPreferences />
        </div>
      </div>
    </>
  );
}
