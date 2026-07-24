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
      <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)]">
        <CardHeader className="text-xl font-bold text-[var(--text-primary)]">
          Review your activities
        </CardHeader>
        <CardDescription className="px-6">
          Review your parsed activities before moving to preferences
        </CardDescription>
        <CardContent
          id="card-review-stuff"
          className="space-y-4 overflow-auto h-[50vh]"
        >
          <SolverReviewCard
            events={events}
            modules={modules}
            onUpdateEvents={() => {}}
          />
          <Button id="btn-confirm-events" type="button" onClick={onComplete}>
            Confirm events
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
