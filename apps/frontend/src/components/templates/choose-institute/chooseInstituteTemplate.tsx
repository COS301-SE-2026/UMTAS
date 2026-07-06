"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { InstituteSelector } from "@/components/organisms/choose-institute/instituteSelector";

export function ChooseInstituteTemplate() {
  return (
    <Card className="mx-auto w-full md:w-1/2">
      <CardHeader>
        <CardTitle>Choose Institute</CardTitle>
      </CardHeader>
      <CardContent>
        <InstituteSelector />
      </CardContent>
    </Card>
  );
}
