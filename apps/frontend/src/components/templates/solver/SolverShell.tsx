"use client";

import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import SolverUpload from "@/components/organisms/solver/SolverUpload";
import SolverReview from "@/components/organisms/solver/SolverReview";
import SolverPreferences from "@/components/organisms/solver/SolverPreferences";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { useState } from "react";
import { SolverLock } from "@/components/organisms/solver/SolverLock";
import { useQuery } from "@tanstack/react-query";

import Tutorial from "@/components/organisms/nav/Tutorial";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";
const steps = [
  {
    target: "#btn-browse-files",
    content: "Choose your timetable file to upload.",
  },
  {
    target: "#btn-upload",
    content: "Upload and process the PDF.",
  },
  {
    target: "#card-review-stuff",
    content: "Review the parsed module events.",
  },
  {
    target: "#btn-confirm-events",
    content: "Confirm the events after reviewing them.",
  },
  {
    target: "#input-name-timetable",
    content: "Enter a name for your timetable.",
  },
  {
    target: "#btn-upload-and-create-timetable",
    content: "Upload the file and create your timetable.",
  },
];

export default function SolverShell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [comingFromStep, setComingFromStep] = useState<number | null>(null);
  const [moduleGroupingID, setModuleGroupingID] = useState<string | null>(null);
  const { university, isLoading: isUniversityLoading } = useUniversityState();

  const { data: modulesData = [] } = useQuery({
    queryKey: ["PDF", "MODULES"],
    queryFn: async () => {
      return (
        await fetchAllModulesv2({
          GroupID: moduleGroupingID || "",
        })
      ).modules;
    },
    enabled: moduleGroupingID != null,
  });

  function handleStepCompleted(fromStep: number) {
    setComingFromStep(fromStep);
    setCompletedSteps((previous) => [...previous, fromStep]);

    // will run the get all modules builder once a pdf is uploaded.
    // module grouping id will be set to null in the pdf parse element
    // that element will then do the requests to upload and poll
    // once the group id is not null then this page will run the query to send
    // for modules and events
    // will automatically be done using the get modules query
    const stepInterval = setInterval(() => {
      if (moduleGroupingID != null && modulesData != undefined) {
        setCurrentStep(fromStep + 1);
        setComingFromStep(null);
        clearInterval(stepInterval);
      }
    }, 676);
  }

  function handleModuleGroupingChange(groupingID: string | null) {
    setModuleGroupingID(groupingID);
    if (groupingID == null) setCurrentStep(0);
  }

  if (isUniversityLoading) return <UniversityStateLoading />;

  const hasRole = university?.role != null;
  if (!hasRole) return <NoRoleSelected />;

  return (
    <>
      <Tutorial steps={steps} wait={true} />

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

      <div className="flex flex-wrap justify-center gap-8 xl:gap-16 w-full max-w-[1920px] mx-auto px-4 md:px-6 pt-6">
        <div className="flex w-120 h-110 justify-center">
          <SolverUpload
            onComplete={() => handleStepCompleted(0)}
            moduleGroupID={moduleGroupingID}
            setModuleGroupID={handleModuleGroupingChange}
          />
        </div>
        <div
          data-testid="div-review-solver"
          className="flex w-120 h-110 justify-center"
        >
          <SolverLock locked={currentStep < 1} loading={comingFromStep === 0}>
            {modulesData != undefined && modulesData?.length != 0 && (
              <SolverReview
                modules={modulesData as ModuleResponseDto[]}
                onComplete={() => handleStepCompleted(1)}
              />
            )}
          </SolverLock>
        </div>
        <div className="flex w-120 h-110 justify-center">
          <SolverLock locked={currentStep < 2} loading={comingFromStep === 1}>
            <SolverPreferences modules={modulesData as ModuleResponseDto[]} />
          </SolverLock>
        </div>
      </div>
    </>
  );
}
