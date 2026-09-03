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
    <Card className="mx-auto min-w-md bg-[var(--bg-surface)]">
      <CardHeader>
        <CardTitle>Choose Institute</CardTitle>
        <br />
        {university && <>Current University : {university.UniversityName}</>}
      </CardHeader>
      <CardContent>
        <InstituteSelector onClose={onClose} />
      </CardContent>
    </Card>
  );
}
