import { HelpStep } from "@/types/HelpPage";

export interface TutorialStepProps {
  step: HelpStep;
}

export default function TutorialStep({ step }: TutorialStepProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full group">
      <div
        className="shrink-0 flex items-center justify-center w-8 h-8 
        rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold mt-2 shadow-md"
      >
        {step.stepNumber}
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-xl">
            {step.title}
          </h3>
          <p className="font-normal text-[var(--text-secondary)] max-w-2xl text-md">
            {step.description}
          </p>
        </div>

        {step.imageUrl && (
          <div
            className="mt-2 w-full rounded-xl overflow-hidden border 
          border-[var(--border)] bg-[var(--bg-surface)] shadow-md transition-all duration-[var(--duration-fast)] group-hover:border-[var(--text-disabled)]"
          >
            <img
              src={step.imageUrl}
              alt={`Step ${step.stepNumber}: ${step.title}`}
              className="w-full h-auto object-cover block"
            />
          </div>
        )}
      </div>
    </div>
  );
}
