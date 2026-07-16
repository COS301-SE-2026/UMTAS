"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";

export default function SolverPreferences() {
  return (
    <>
      <Card>
        <CardHeader>Preferences</CardHeader>
        <CardContent>
          Preferences your stuff here cuz
          <CardDescription>Very descriptive</CardDescription>
        </CardContent>
      </Card>
    </>
  );
}
