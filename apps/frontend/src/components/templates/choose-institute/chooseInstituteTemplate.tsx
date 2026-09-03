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

  if (isLoading) return <UniversityStateLoading />;

  return (
    <Card className="w-full max-w-md mx-auto bg-[var(--bg-surface)] p-4 sm:p-6 border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Choose Institute</CardTitle>
        {university && <>Current University : {university.UniversityName}</>}
      </CardHeader>
      <CardContent className="p-0">
        <InstituteSelector onClose={onClose} />
      </CardContent>
    </Card>
  );
}
