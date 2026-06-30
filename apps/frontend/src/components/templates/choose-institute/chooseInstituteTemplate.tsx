"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { InstituteSelector } from "@/components/organisms/choose-institute/instituteSelector";

export function ChooseInstituteTemplate({
  passedrole,
}: {
  passedrole?: string;
}) {
  const handleSelection = (instituteId: string, role: string) => {
    role = role.toLowerCase();
    instituteId = instituteId.toLowerCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Institute</CardTitle>
      </CardHeader>
      <CardContent>
        <InstituteSelector
          passedrole={passedrole}
          onInstituteSelected={handleSelection}
        />
      </CardContent>
    </Card>
  );
}
