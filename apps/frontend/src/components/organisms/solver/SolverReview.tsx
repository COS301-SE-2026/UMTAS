"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Button } from "@/components/atoms/baseShadcn/button";

interface SolverReviewProps {
  modules: ModuleResponseDto[];
  events: EventResponse[];
}

export default function SolverReview({ events, modules }: SolverReviewProps) {
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
          {events?.map((event) => {
            return (
              <CustomiseEventPanel
                key={event.eventID}
                event={event}
                modules={modules}
              />
            );
          }) || <p>No event found</p>}
          <Button type="button">Set Preferences</Button>
        </CardContent>
      </Card>
    </>
  );
}
