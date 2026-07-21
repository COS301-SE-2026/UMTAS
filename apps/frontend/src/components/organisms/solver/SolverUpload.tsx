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

  const { data: pdfLookupResult, isLoading: pdfLookupLoading } = useQuery(
    lookupPdfHash({
      universityId: UserDetails.getUniDetails()?.UniversityID || "",
      adapterKey: "up",
      fingerprintAlgorithm: "pdf-stream-payload-sha256-v1",
      pdfStreamHash: pdfHash || "",
    }),
  );

  const { data: pdfJobResult } = useQuery(
    pollPdfResult({ jobId: jobId || "" }),
  );
  const UploadPDFmut = useMutation(uploadPDF());
  // uploads and starts the timeout function
  async function uploadFile(file: File) {
    // on success of the request
    console.log("Upload file ran ");
    if (file) {
      console.log("file selected awaiting hash");
      const result = await fileHash(file);
      if (result.ok) {
        setPdfHash(result.hash);
        console.log("hash received", result.hash);
      }
    }
  }

  async function pollEvents() {
    while (pdfLookupLoading) {
      // wait for it to finalize
    }
    if (
      pdfLookupResult?.jobId &&
      pdfLookupResult.status === "completed" &&
      pdfLookupResult.moduleGroupingId
    ) {
      // means this pdf does already exist
      // Module grouping updated
      setModuleGroupID(pdfLookupResult.moduleGroupingId);
      onComplete();
    } else {
      // pdf job does not exist for this hash
      // Upload pdf
      console.log("uploading pdf");
      if (!selectedFile) throw new Error("No selected file");

      const result = await UploadPDFmut.mutateAsync({
        file: await selectedFile,
        universityId: UserDetails.getUniDetails()?.UniversityID || "",
        adapterKey: "up",
      });
      const Pollinterval = setInterval(async () => {
        console.log("Polled", pdfJobResult);
        await setJobID(result.jobId);
        getQueryClient().invalidateQueries({
          queryKey: pollPdfResult({
            jobId: jobId || "",
          }).queryKey,
        });
        if (
          pdfJobResult?.status === "completed" &&
          pdfJobResult.moduleGroupingId
        ) {
          clearInterval(Pollinterval);
          setModuleGroupID(pdfJobResult.moduleGroupingId);
          onComplete();
        }
      }, 5000);
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
              if (file) uploadFile(file);
            }}
          />
        </div>

        <Button
          type="button"
          className="w-fit"
          onClick={() => {
            pollEvents();
          }}
        >
          Review
        </Button>
      </CardContent>
    </Card>
  );
}
