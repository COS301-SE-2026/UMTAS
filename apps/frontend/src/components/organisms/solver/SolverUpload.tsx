"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import {
  fileHash,
  lookupPdfHash,
  pollPdfResult,
  uploadPDF,
} from "@/app/solver/queries/PDF/queries";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { CheckSquare } from "lucide-react";

interface SolverUploadProps {
  onComplete: () => void;
  moduleGroupID: string | null;
  setModuleGroupID: (input: string | null) => void;
}

export default function SolverUpload({
  onComplete,
  moduleGroupID,
  setModuleGroupID,
}: SolverUploadProps) {
  //connects to the upload part
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfHash, setPdfHash] = useState<string | null>(null);
  const [jobId, setJobID] = useState<string | null>(null);

  const { data: pdfLookupResult, isLoading: pdfLookupLoading } = useQuery({
    ...lookupPdfHash({
      universityId: UserDetails.getUniDetails()?.UniversityID || "",
      adapterKey: "up",
      fingerprintAlgorithm: "pdf-stream-payload-sha256-v1",
      pdfStreamHash: pdfHash || "",
    }),
  });

  const { data: pdfJobResult } = useQuery({
    ...pollPdfResult({ jobId: jobId || "" }),
  });

  const UploadPDFmut = useMutation(uploadPDF());
  // uploads and starts the timeout function
  async function uploadFile(file: File) {
    // on success of the request
    if (file) {
      const result = await fileHash(file);
      if (result.ok) {
        setPdfHash(result.hash);
      }
    }
  }

  async function pollEvents() {
    if (!selectedFile) throw new Error("No selected file");

    if (
      pdfLookupResult?.status === "completed" &&
      pdfLookupResult.moduleGroupingId
    ) {
      setModuleGroupID(pdfLookupResult.moduleGroupingId);
      onComplete();
    } else {
      const interval = setInterval(async () => {
        await setJobID(result.jobId);
        if (
          pdfJobResult?.status === "completed" &&
          pdfJobResult.moduleGroupingId
        ) {
          clearInterval(interval);
          setModuleGroupID(pdfJobResult.moduleGroupingId);
          onComplete();
        }
      }, 500);
      const result = await UploadPDFmut.mutateAsync({
        file: await selectedFile,
        universityId: UserDetails.getUniDetails()?.UniversityID || "",
        adapterKey: "up",
      });
      await setJobID(result.jobId);
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
            {selectedFile && (
              <>
                {selectedFile.name}
                <br />
              </>
            )}
          </p>

          <div className="items-center text-center flex flex-col justify-center">
            {pdfJobResult?.status === "queued" && (
              <>
                {pdfJobResult?.status}
                <Spinner />
              </>
            )}
            {pdfJobResult?.status === "completed" && (
              <>
                {pdfJobResult?.status}
                <CheckSquare />
              </>
            )}
          </div>

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
              if (file) uploadFile(file);
            }}
          />
        </div>

        <Button
          disabled={pdfLookupResult?.status === "completed"}
          type="button"
          className="w-fit"
          onClick={() => {
            if (pdfLookupResult?.status != "completed") pollEvents();
            else {
              if (pdfLookupResult.moduleGroupingId) {
                setModuleGroupID(pdfLookupResult?.moduleGroupingId);
                onComplete();
              }
            }
          }}
        >
          Upload
        </Button>
      </CardContent>
    </Card>
  );
}
