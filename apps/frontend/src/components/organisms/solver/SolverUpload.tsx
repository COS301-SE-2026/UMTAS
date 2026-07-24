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
import {
  PDFjobLookupBuilder,
  PDFjobStatusBuilder,
} from "@/app/solver/queries/PDF/builder";

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
  const [currentlyPolling, SetCurrentlyPolling] = useState<boolean>(false);

  const { data: pdfJobResult } = useQuery({
    queryKey: ["PDF", jobId],
    queryFn: async () => {
      const builder = new PDFjobStatusBuilder();
      const result = await builder.send({ paths: { jobId: jobId || "" } });
      console.log("polled", result);

      if (
        result?.moduleGroupingId != null &&
        moduleGroupID != result.moduleGroupingId
      ) {
        console.log("stopped polling");
        SetCurrentlyPolling(false);
        setModuleGroupID(result.moduleGroupingId);
        onComplete();
      } else if (result?.status === "failed" && jobId !== null) {
        setJobID(null);
        setSelectedFile(null);
        SetCurrentlyPolling(false);
        setPdfHash(null);
        getQueryClient().clear();
      }

      return result;
    },
    enabled: jobId != "" && jobId != null && moduleGroupID == null,
    refetchInterval: 2500,
  });

  const UploadPDFmut = useMutation(uploadPDF());
  // uploads and starts the timeout function
  async function uploadFile(file: File) {
    if (!file) return;

    const result = await fileHash(file);
    if (!result.ok) return;
    await setPdfHash(result.hash);
    const lookupStatus = await new PDFjobLookupBuilder().send({
      body: {
        adapterKey: "up",
        fingerprintAlgorithm: "pdf-stream-payload-sha256-v1",
        pdfStreamHash: result.hash,
        universityId: UserDetails.getUniDetails()?.UniversityID || "",
      },
    });

    if (lookupStatus.status === "completed" && lookupStatus.moduleGroupingId) {
      setModuleGroupID(lookupStatus.moduleGroupingId);
      onComplete();
    }
  }

  async function pollEvents() {
    SetCurrentlyPolling(true);
    if (!selectedFile) throw new Error("No selected file");

    const result = await UploadPDFmut.mutateAsync({
      file: await selectedFile,
      universityId: UserDetails.getUniDetails()?.UniversityID || "",
      adapterKey: "up",
    });
    console.log(result.jobId, "PDF uploaded");
    await setJobID(result.jobId);
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
            {selectedFile && (
              <>
                {pdfJobResult?.status === "completed" ? (
                  <>
                    {pdfJobResult?.status}
                    <CheckSquare />
                  </>
                ) : currentlyPolling ? (
                  <>
                    {pdfJobResult?.status}
                    <Spinner />
                  </>
                ) : (
                  <></>
                )}
              </>
            )}
          </div>

          <Button
            id="btn-browse-files"
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
              setJobID(null);
              SetCurrentlyPolling(false);
              setPdfHash(null);
              setModuleGroupID(null);
              setSelectedFile(file);
              getQueryClient().clear();
              if (file) {
                uploadFile(file);
              }
            }}
          />
        </div>

        <Button
          id="btn-upload"
          disabled={
            currentlyPolling || moduleGroupID != null || selectedFile == null
          }
          type="button"
          className="w-fit"
          onClick={() => {
            if (pdfJobResult?.status != "completed") pollEvents();
          }}
        >
          {pdfJobResult?.status === "completed" && !currentlyPolling && (
            <>continue</>
          )}
          {pdfJobResult?.status !== "completed" && !currentlyPolling && (
            <>upload</>
          )}
          {(currentlyPolling || pdfJobResult?.status === "queued") && (
            <>
              waiting for updates <br /> <Spinner />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
