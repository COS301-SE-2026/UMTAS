"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";

export default function SolverUpload() {
  return (
    <>
      <Card>
        <CardHeader>Upload</CardHeader>
        <CardContent>
          Upload your stuff here cuz
          <CardDescription>Very descriptive</CardDescription>
        </CardContent>
      </Card>
    </>
  );
}
