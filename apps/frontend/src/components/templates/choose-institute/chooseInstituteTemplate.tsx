"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { InstituteSelector } from "@/components/organisms/choose-institute/instituteSelector";

export function ChooseInstituteTemplate({
  passedRole,
}: {
  passedRole?: string;
}) {
  const router = useRouter();

  function handleSelection(instituteId: string, role: string) {
    router.push(
      //update to specific route later on
      `/builder?institute=${instituteId.toLowerCase()}&role=${role.toLowerCase()}`,
    );
  }

  return (
    <Card className="mx-auto w-full md:w-1/2">
      <CardHeader>
        <CardTitle>Choose Institute</CardTitle>
      </CardHeader>
      <CardContent>
        <InstituteSelector
          passedRole={passedRole}
          onInstituteSelected={handleSelection}
        />
      </CardContent>
    </Card>
  );
}
