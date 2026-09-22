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
import { demoPdf, fileHash, uploadPDF } from "@/app/solver/queries/PDF/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { CheckSquare } from "lucide-react";
import {
  DEMO_PDF_FILENAME,
  PDFjobLookupBuilder,
  PDFjobStatusBuilder,
} from "@/app/solver/queries/PDF/builder";
import { useIsGuest } from "@/hooks/useIsGuest";

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
  const [, setPdfHash] = useState<string | null>(null);
  const [jobId, setJobID] = useState<string | null>(null);
  const [currentlyPolling, SetCurrentlyPolling] = useState<boolean>(false);
  const { isGuest } = useIsGuest();
  const isDemoPdfSelected = selectedFile?.name === DEMO_PDF_FILENAME;

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
  const demoPdfMutation = useMutation(demoPdf());

  function selectFile(file: File | null) {
    setJobID(null);
    SetCurrentlyPolling(false);
    setPdfHash(null);
    setModuleGroupID(null);
    getQueryClient().clear();
    setSelectedFile(file);
    if (file) {
      uploadFile(file);
    }
  }

  async function handleUseDemoPdf() {
    try {
      const file = await demoPdfMutation.mutateAsync();
      selectFile(file);
    } catch {
      // The mutation error is rendered inline below the file controls.
    }
  }
  // Uploads the file and checks for an existing parsed result.
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
    <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)] w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[var(--text-primary)]">
          Upload your timetable PDF
        </CardTitle>
      </CardHeader>
      <CardDescription className="px-6">
        Upload your PDF file here to start the timetable creation process
      </CardDescription>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="min-h-0 flex-1 overflow-hidden border-2 border-dashed border-[var(--border)] rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)] text-[var(--text-secondary)]">
          <p className="w-full text-sm text-center font-mono leading-relaxed">
            {!selectedFile && (
              <>Upload a PDF file to start the timetable creation process.</>
            )}
            {selectedFile && (
              <>
                <span className="block truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
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

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              id="btn-browse-files"
              variant="outline"
              onClick={() => uploadFileRef.current?.click()}
              className="font-mono"
            >
              Browse files
            </Button>

            {isGuest && (
              <Button
                data-testid="btn-demo-pdf"
                type="button"
                variant="outline"
                disabled={isDemoPdfSelected || demoPdfMutation.isPending}
                onClick={() => void handleUseDemoPdf()}
                className="font-mono"
              >
                {demoPdfMutation.isPending && <Spinner />}
                {demoPdfMutation.isPending
                  ? "Loading demo PDF..."
                  : "Use a demo PDF"}
              </Button>
            )}
          </div>

          {demoPdfMutation.isError && (
            <p className="text-sm text-center text-destructive" role="alert">
              The demo PDF could not be loaded. Please upload your own PDF.
            </p>
          )}

          <Input
            data-testid="input-file-pdf"
            ref={uploadFileRef}
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={(inputFile) =>
              selectFile(inputFile.target.files?.[0] ?? null)
            }
          />
        </div>

        <div className="flex shrink-0 justify-center pt-2">
          <Button
            data-testid="btn-upload-confirm"
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
              <>Continue</>
            )}
            {pdfJobResult?.status !== "completed" && !currentlyPolling && (
              <>Upload</>
            )}
            {(currentlyPolling || pdfJobResult?.status === "queued") && (
              <>
                Waiting for Updates <br /> <Spinner />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
