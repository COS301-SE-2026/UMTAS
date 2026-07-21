"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";

interface SolverUploadProps {
  onComplete: () => void;
  moduleGroupID: string | null;
  setModuleGroupID: (input: string | null) => void;
}

export default function SolverUpload({ onComplete }: SolverUploadProps) {
  //connects to the upload part
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobID, setJobID] = useState<string | null>(null);

  // uploads and starts the timeout function
  async function uploadFile() {
    // on success of the request
    if (jobID) pollEvents(jobID);
  }

  async function pollEvents(jobID: string | null) {
    if (jobID) {
      onComplete();
    }
  }
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
            {!selectedFile && (
              <>
                Drag and drop here
                <br />
                or
              </>
            )}
            {selectedFile && <>{selectedFile.name}</>}
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
            onChange={(inputFile) => {
              const file = inputFile.target.files?.[0] || null;
              setSelectedFile(file);
            }}
          />
        </div>

        <Button
          type="button"
          className="w-fit"
          onClick={() => {
            // will only fire once the whole function is correct
          }}
        >
          Review
        </Button>
      </CardContent>
    </Card>
  );
}
