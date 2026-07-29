"use client";

import React from "react";
import { ArrowLeft, MoveRight } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Separator } from "@/components/atoms/baseShadcn/separator";

interface WizardFooterProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled: boolean;
}

export function WizardFooter({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: WizardFooterProps) {
  function renderBackButton() {
    if (!onBack) {
      return null;
    }

    return (
      <Button
        type="button"
        variant="ghost"
        size="default"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)]"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </Button>
    );
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-base)]">
      <div className="flex items-center justify-between pt-4">
        <div>{renderBackButton()}</div>

        <Button
          data-testid="builder-Next-Step"
          type="button"
          size="default"
          variant={"outline"}
          disabled={nextDisabled}
          onClick={onNext}
          className="flex items-center gap-2 text-sm"
        >
          {nextLabel}
          <MoveRight size={16} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
