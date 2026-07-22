"use client";

import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import SolverUpload from "@/components/organisms/solver/SolverUpload";
import SolverReview from "@/components/organisms/solver/SolverReview";
import SolverPreferences from "@/components/organisms/solver/SolverPreferences";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { useState } from "react";
import { SolverLock } from "@/components/organisms/solver/SolverLock";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getAllEventsAdminQ } from "@/app/module-management/queries/queries";
import { fetchAllModules } from "@/app/course-management/queries/modules/moduleBuilder";

export default function SolverShell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [comingFromStep, setComingFromStep] = useState<number | null>(null);
  const [moduleGroupingID, setModuleGroupingID] = useState<string | null>(null);
  const { data: modulesData } = useQuery({
    queryKey: ["PDF", "MODULES"],
    queryFn: () => {
      return fetchAllModules({
        GroupID: moduleGroupingID || "",
      });
    },
    enabled: moduleGroupingID != null,
  });
  const displayMods = modulesData?.filter((mod) => {
    return mod.ModuleGroupingID == moduleGroupingID;
  });
  const eventQueries = useQueries({
    queries: (displayMods ?? []).map((mod) => ({
      ...getAllEventsAdminQ(mod.moduleID),
      enabled: !!mod.moduleID,
    })),
  });

  const events: EventResponse[] = eventQueries.map((q) => q.data ?? []).flat();

  function handleStepCompleted(fromStep: number) {
    setComingFromStep(fromStep);
    setCompletedSteps((previous) => [...previous, fromStep]);

    // will run the get all modules builder once a pdf is uploaded.
    // module grouping id will be set to null in the pdf parse element
    // that element will then do the requests to upload and poll
    // once the group id is not null then this page will run the query to send
    // for modules and events
    // will automatically be done using the get modules query
    setTimeout(() => {
      setCurrentStep(fromStep + 1);
      setComingFromStep(null);
    }, 676);
  }

  if (moduleGroupingID == null && currentStep != 0) {
    setCurrentStep(0);
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
          <SolverUpload
            onComplete={() => handleStepCompleted(0)}
            moduleGroupID={moduleGroupingID}
            setModuleGroupID={setModuleGroupingID}
          />
        </div>

        <div className="flex justify-center h-fit">
          <SolverLock locked={currentStep < 1} loading={comingFromStep === 0}>
            <SolverReview
              events={events}
              modules={displayMods as ModuleResponseDto[]}
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
