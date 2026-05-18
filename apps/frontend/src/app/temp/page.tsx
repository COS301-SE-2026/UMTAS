"use client";
import React from "react";
import { WizardStepper } from "@/components/atoms/builder/WizardStepper";
import { WizardFooter } from "@/components/atoms/builder/WizardFooter";

const Steps = [
  { label: "Modules" },
  { label: "Events" },
  { label: "Generate" },
];

export default function temp() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);

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

  function renderBack() {
    if (currentStep === 0) return undefined;
    return handleBack;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      <WizardStepper
        currentStep={currentStep}
        steps={Steps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* placeholder content */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Step {currentStep + 1} — {Steps[currentStep].label}
        </p>
      </div>

      <WizardFooter
        onBack={renderBack()}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        nextDisabled={false}
      />
    </div>
  );
}
