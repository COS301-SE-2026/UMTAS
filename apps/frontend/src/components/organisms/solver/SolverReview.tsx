"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Button } from "@/components/atoms/baseShadcn/button";
import SolverReviewCard from "@/components/molecules/solver/SolverReviewCard";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
  events: EventResponse[];
  onComplete: () => void;
}

export default function SolverReview({
  events,
  modules,
  onComplete,
}: SolverReviewProps) {
  return (
    <>
      <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)] w-full h-full flex flex-col">
        <CardHeader className="text-xl font-bold text-[var(--text-primary)]">
          Review your Activities
        </CardHeader>
        <CardDescription className="px-6">
          Review your parsed activities before moving to preferences
        </CardDescription>
        <CardContent
          id="card-review-stuff"
          className="flex flex-col flex-1 overflow-hidden space-y-4"
        >
          <div className="flex-1 overflow-y-auto pr-2">
            <SolverReviewCard
              events={events}
              modules={modules}
              onUpdateEvents={() => {}}
            />
          </div>
          <div className="mt-auto shrink-0 pt-2">
            <Button id="btn-confirm-events" type="button" onClick={onComplete}>
              Confirm Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
