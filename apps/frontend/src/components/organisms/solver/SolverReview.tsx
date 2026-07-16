"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";

export default function SolverReview() {
  return (
    <>
      <Card>
        <CardHeader>Review</CardHeader>
        <CardContent>
          Review your stuff here cuz
          <CardDescription>Very descriptive</CardDescription>
        </CardContent>
      </Card>
    </>
  );
}
