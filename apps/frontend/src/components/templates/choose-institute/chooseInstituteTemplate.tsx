"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { InstituteSelector } from "@/components/organisms/choose-institute/instituteSelector";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

interface ChooseInstituteTemplateProps {
  onClose?: () => void;
}

export function ChooseInstituteTemplate({
  onClose,
}: ChooseInstituteTemplateProps) {
  const { university, isLoading } = useUniversityState();

  if (isLoading) {
    return <UniversityStateLoading />;
  }

  return (
    <Card className="mx-auto w-full max-w-md border-0 bg-[var(--bg-surface)] p-4 shadow-none sm:border sm:p-6 sm:shadow-sm">
      <CardHeader className="p-0 pb-6 text-left">
        <CardTitle className="text-xl sm:text-2xl">Choose Institute</CardTitle>

        {university && (
          <p className="text-sm text-muted-foreground">
            Current University: {university.UniversityName}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <InstituteSelector onClose={onClose} />
      </CardContent>
    </Card>
  );
}
