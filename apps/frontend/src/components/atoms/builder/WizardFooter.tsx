"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { MoveRight } from "lucide-react";

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
        className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={14} />
        Back
      </Button>
    );
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-base)]">
      <Separator />
      <div className="flex items-center justify-between px-6 py-3">
        <div>{renderBackButton()}</div>

        <Button
          type="button"
          size="default"
          disabled={nextDisabled}
          onClick={onNext}
          className="flex items-center gap-1.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-40"
        >
          {nextLabel}
          <MoveRight size={14} />
        </Button>
      </div>
    </div>
  );
}
