"use client";

import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import SolverUpload from "@/components/organisms/solver/SolverUpload";

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
        <div>Review</div>
        <div>Preferences</div>
      </div>
    </>
  );
}
