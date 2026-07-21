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
import React, { useState } from "react";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
  events: EventResponse[];
  onComplete: () => void;
}

export default function SolverReview({
  events: initialEvents,
  modules,
  onComplete,
}: SolverReviewProps) {
  const [events, setEvents] = useState<EventResponse[]>(initialEvents);
  return (
    <>
      <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)]">
        <CardHeader className="text-xl font-bold text-[var(--text-primary)]">
          Review your activities
        </CardHeader>
        <CardDescription className="px-6">
          Review your parsed activities before moving to preferences
        </CardDescription>
        <CardContent className="space-y-4">
          <SolverReviewCard
            events={events}
            modules={modules}
            onUpdateEvents={setEvents}
          />
          <Button type="button" onClick={onComplete}>
            Set Preferences
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
