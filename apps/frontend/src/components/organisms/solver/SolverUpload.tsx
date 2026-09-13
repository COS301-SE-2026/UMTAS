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
import { fileHash, uploadPDF } from "@/app/solver/queries/PDF/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { CheckSquare } from "lucide-react";
import {
  PDFjobLookupBuilder,
  PDFjobStatusBuilder,
} from "@/app/solver/queries/PDF/builder";
import { useIsGuest } from "@/hooks/useIsGuest";
import DemoPdfDialog from "@/components/molecules/solver/DemoPdfDialog";

const DEMO_PDF_PROMPT_STORAGE_KEY = "umtas-demo-pdf-prompt";

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
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const dismissedThisSession = useRef(false);
  const { isGuest, isPending: isGuestPending } = useIsGuest();

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

  useEffect(() => {
    if (
      isGuestPending ||
      !isGuest ||
      selectedFile ||
      dismissedThisSession.current
    ) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const dismissed = window.sessionStorage.getItem(
      DEMO_PDF_PROMPT_STORAGE_KEY,
    );
    if (dismissed === "true") {
      dismissedThisSession.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => setShowDemoDialog(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, [dismissedThisSession, isGuest, isGuestPending, selectedFile]);

  function handleDemoDialogChange(open: boolean) {
    setShowDemoDialog(open);
    if (!open && typeof window !== "undefined") {
      window.sessionStorage.setItem(DEMO_PDF_PROMPT_STORAGE_KEY, "true");
      dismissedThisSession.current = true;
    }
  }
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
    <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)] w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[var(--text-primary)]">
          Upload your timetable PDF
        </CardTitle>
      </CardHeader>
      <CardDescription className="px-6">
        Upload your PDF file here to start the timetable creation process
      </CardDescription>

      <CardContent className="space-y-6 flex-1">
        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)] text-[var(--text-secondary)]">
          <p className="text-sm text-center font-mono leading-relaxed">
            {!selectedFile && (
              <>Upload a PDF file to start the timetable creation process.</>
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
                onClick={() => setShowDemoDialog(true)}
                className="font-mono"
              >
                Use a demo PDF
              </Button>
            )}
          </div>

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
      </CardContent>

      <DemoPdfDialog
        open={showDemoDialog}
        onOpenChange={handleDemoDialogChange}
        onFileReady={selectFile}
      />
    </Card>
  );
}
