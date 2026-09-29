"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";

import { Progress } from "@/components/atoms/baseShadcn/progress";
import Popup from "@/components/atoms/utility/floatContainer";
import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type NavigatorWithGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
};

type SetupStatus = "idle" | "installing" | "ready" | "error";

const MODEL_KEY = "vision-model-ready-v3";
const CACHE_NAME = "vision-models-v3";

const MODELS = [
  {
    name: "Nano Detection Model",
    url: "/models/yolo26n.onnx",
  },
  {
    name: "Nano Pose Model",
    url: "/models/yolo26n-pose.onnx",
  },
  {
    name: "Small Detection Model",
    url: "/models/yolo26s.onnx",
  },
  {
    name: "Small Pose Model",
    url: "/models/yolo26s-pose.onnx",
  },
  {
    name: "Medium Detection Model",
    url: "/models/yolo26m.onnx",
  },
  {
    name: "Medium Pose Model",
    url: "/models/yolo26m-pose.onnx",
  },
];

export default function VisionModelSetupPage() {
  const router = useRouter();

  const [status, setStatus] = useState<SetupStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [downloadedMb, setDownloadedMb] = useState(0);
  const [totalMb, setTotalMb] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  useEffect(() => {
    async function checkExistingCache() {
      if (localStorage.getItem(MODEL_KEY) !== "true") return;

      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedModels = await Promise.all(
          MODELS.map((model) => cache.match(model.url)),
        );

        if (cachedModels.every(Boolean)) {
          setStatus("ready");
          setProgress(100);
          return;
        }

        localStorage.removeItem(MODEL_KEY);
      } catch {
        localStorage.removeItem(MODEL_KEY);
      }
    }

    void checkExistingCache();
  }, []);

  async function cacheModel(url: string, modelIndex: number): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) return;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `The vision model could not be downloaded (${response.status}).`,
      );
    }

    if (!response.body) {
      throw new Error("This browser cannot stream the vision model download.");
    }

    const cachePromise = cache.put(url, response.clone());
    const reader = response.body.getReader();
    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? Number(contentLength) : null;

    setTotalMb(
      totalBytes !== null
        ? Number((totalBytes / 1024 / 1024).toFixed(1))
        : null,
    );

    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      receivedBytes += value.length;
      setDownloadedMb(Number((receivedBytes / 1024 / 1024).toFixed(1)));

      if (totalBytes) {
        const modelProgress = receivedBytes / totalBytes;
        const overallProgress =
          (modelIndex / MODELS.length) * 100 +
          modelProgress * (100 / MODELS.length);

        setProgress(Math.min(overallProgress, 100));
      }
    }

    await cachePromise;
  }

  async function prepareModels() {
    setStatus("installing");
    setError(null);
    setProgress(0);
    setDownloadedMb(0);
    setTotalMb(null);

    const toastId = toast.loading("Preparing Lecture Watch", {
      description: "Checking WebGPU and preparing the vision models.",
    });

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Lecture Watch requires HTTPS or localhost so the browser can use WebGPU safely.",
        );
      }

      const gpu = (navigator as NavigatorWithGPU).gpu;

      if (!gpu) {
        throw new Error(
          "WebGPU is not available. Use an up-to-date Chrome browser with graphics acceleration enabled.",
        );
      }

      const adapter = await gpu.requestAdapter();

      if (!adapter) {
        throw new Error(
          "Chrome could not access a compatible GPU. Check hardware acceleration and the WebGPU demo settings below.",
        );
      }

      for (let i = 0; i < MODELS.length; i++) {
        const model = MODELS[i];

        setCurrentModel(model.name);
        setDownloadedMb(0);
        setTotalMb(null);

        await cacheModel(model.url, i);
        setProgress(((i + 1) / MODELS.length) * 100);
      }

      localStorage.setItem(MODEL_KEY, "true");

      setCurrentModel(null);
      setProgress(100);
      setStatus("ready");

      toast.success("Lecture Watch is ready", {
        id: toastId,
        description: "The required vision models are available on this device.",
      });
    } catch (err) {
      console.error(err);

      localStorage.removeItem(MODEL_KEY);

      const message =
        err instanceof Error
          ? err.message
          : "Vision model setup failed. Please try again.";

      setError(message);
      setCurrentModel(null);
      setStatus("error");

      toast.error("Vision model setup failed", {
        id: toastId,
        description: message,
      });
    }
  }

  function getRequirementStatus(requirement: "webgpu" | "detection" | "pose") {
    if (status === "ready") return "Ready";
    if (status === "error") return "Not ready";

    if (status === "installing") {
      if (requirement === "webgpu") {
        return "Verified";
      }

      if (requirement === "detection" && currentModel?.includes("Detection")) {
        return "Downloading";
      }

      if (requirement === "pose" && currentModel?.includes("Pose")) {
        return "Downloading";
      }

      return "Preparing";
    }

    return "Pending";
  }
  const currentModelNumber = currentModel
    ? MODELS.findIndex((model) => model.name === currentModel) + 1
    : 0;
  return (
    <main className="w-full px-8 pt-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="w-full border-b border-[var(--border)] pb-4">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Prepare Lecture Watch
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Check this device and download the models needed for people
            detection and lecture analysis.
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-2">
            <RequirementRow
              label="WebGPU"
              description="Lets Lecture Watch run the models using your GPU."
              status={getRequirementStatus("webgpu")}
            />

            <RequirementRow
              label="Person Detection"
              description="Finds and tracks people in the current input."
              status={getRequirementStatus("detection")}
            />

            <RequirementRow
              label="Lecture Analysis"
              description="Analyses pose, movement and attention signals."
              status={getRequirementStatus("pose")}
            />
          </section>

          {status === "installing" && (
            <section className="space-y-3" aria-label="Vision model progress">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {currentModel
                      ? `Preparing ${currentModel}`
                      : "Preparing vision models"}
                  </p>

                  <p className="text-xs text-[var(--text-secondary)]">
                    Keep this page open until setup is complete.
                  </p>
                </div>

                <span className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
                  {progress.toFixed(0)}%
                </span>
              </div>

              <Progress
                value={progress}
                className="h-2 w-full"
                aria-label={`Vision model setup ${progress.toFixed(0)}% complete`}
              />

              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>
                  {downloadedMb.toFixed(1)} MB
                  {totalMb !== null && ` / ${totalMb.toFixed(1)} MB`}
                </span>

                <span>
                  Model {currentModelNumber} of {MODELS.length}
                </span>
              </div>
            </section>
          )}

          {status === "error" && error && (
            <Alert variant="destructive">
              <AlertTitle>Setup could not finish</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === "ready" && (
            <Alert variant="success">
              <AlertTitle>Ready to continue</AlertTitle>
              <AlertDescription>
                The vision models are available on this device. You can now
                start a Lecture Watch session.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-center gap-x-2">
          {status === "ready" ? (
            <Button onClick={() => router.push("/VisionModel")}>
              Continue
            </Button>
          ) : (
            <Button onClick={prepareModels} disabled={status === "installing"}>
              {status === "installing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing Models
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {status === "error" ? "Try Again" : "Prepare Vision Models"}
                </>
              )}
            </Button>
          )}
          <Button>Setup Guide</Button>
        </div>
      </div>
      {showGuide && <Popup onClose={() => setShowGuide(false)}></Popup>}
    </main>
  );
}

function RequirementRow({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex min-h-20 w-full items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-(--bg-surface) p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </p>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <Badge
        variant="outline"
        className="whitespace-nowrap text-[var(--text-secondary)]"
      >
        {status}
      </Badge>
    </div>
  );
}
