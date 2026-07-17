"use client";

import { useRef } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";

export default function SolverUpload() {
  //connects to the upload part
  const uploadFileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[var(--text-primary)]">
          Upload your timetable PDF
        </CardTitle>
      </CardHeader>
      <CardDescription className="px-6">
        Upload your PDF file here to start the timetable creation process
      </CardDescription>

      <CardContent className="space-y-6">
        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)] text-[var(--text-secondary)]">
          <p className="text-sm text-center font-mono leading-relaxed">
            Drag and drop here
            <br />
            or
          </p>

          <Button
            variant="outline"
            onClick={() => uploadFileRef.current?.click()}
            className="font-mono"
          >
            Browse files
          </Button>

          <Input
            ref={uploadFileRef}
            type="file"
            className="hidden"
            accept=".pdf"
          />
        </div>

        <Button type="button" className="w-fit">
          Review
        </Button>
      </CardContent>
    </Card>
  );
}
