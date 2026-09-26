"use client";

import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavigatorWithGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
};

type SetupStatus = "idle" | "installing" | "ready" | "error";

const MODEL_KEY = "vision-model-ready";
const CACHE_NAME = "vision-models-v1";

const MODELS = [
  {
    name: "Person Detection Model",
    url: "/models/yolo26n.onnx",
  },
  {
    name: "Pose Estimation Model",
    url: "/models/yolo26n-pose.onnx",
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

  useEffect(() => {
    async function checkExistingCache() {
      if (localStorage.getItem(MODEL_KEY) === "true") {
        try {
          const cache = await caches.open(CACHE_NAME);
          const match1 = await cache.match(MODELS[0].url);
          const match2 = await cache.match(MODELS[1].url);

          if (match1 && match2) {
            setStatus("ready");
            setProgress(100);
          }
        } catch {}
      }
    }
    checkExistingCache();
  }, []);

  async function cacheModel(url: string, modelIndex: number): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      return;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${url} with status ${response.status}. Ensure the model file exists in public/models/.`,
      );
    }

    await cache.put(url, response.clone());

    if (!response.body) {
      throw new Error("Streamed downloads not supported by your browser.");
    }

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
  }

  async function prepareModels() {
    setStatus("installing");
    setError(null);
    setProgress(0);
    setDownloadedMb(0);
    setTotalMb(null);

    try {
      const gpu = (navigator as NavigatorWithGPU).gpu;

      if (!gpu) {
        throw new Error(
          "WebGPU is not available in this browser. Please use a browser with WebGPU support.",
        );
      }

      const adapter = await gpu.requestAdapter();

      if (!adapter) {
        throw new Error(
          "A compatible graphics adapter could not be found. Try updating your browser or device drivers.",
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
    } catch (err) {
      console.error(err);

      localStorage.removeItem(MODEL_KEY);

      setError(
        err instanceof Error
          ? err.message
          : "Vision model setup failed. Please try again.",
      );

      setCurrentModel(null);
      setStatus("error");
    }
  }

  function getRequirementStatus(requirement: "webgpu" | "detection" | "pose") {
    if (status === "ready") {
      return "Ready";
    }

    if (status === "error") {
      return "Not Ready";
    }

    if (status === "installing") {
      if (requirement === "webgpu") {
        return "Verified";
      }

      if (
        requirement === "detection" &&
        currentModel === "Person Detection Model"
      ) {
        return "Caching";
      }

      if (requirement === "pose" && currentModel === "Pose Estimation Model") {
        return "Caching";
      }

      if (
        requirement === "detection" &&
        currentModel === "Pose Estimation Model"
      ) {
        return "Ready";
      }
    }

    return "Pending";
  }

  return (
    <main className="flex min-h-[80vh] w-full items-center justify-center px-4">
      <Card className="w-full max-w-xl border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-semibold text-[var(--text-primary)]">
            Vision Model Setup
          </CardTitle>

          <CardDescription className="text-sm text-[var(--text-secondary)]">
            Verify WebGPU and cache local model files into browser storage.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <section className="space-y-2">
            <RequirementRow
              label="WebGPU"
              description="Required for accelerated vision processing."
              status={getRequirementStatus("webgpu")}
            />

            <RequirementRow
              label="Person Detection Model"
              description="Detects people within camera and uploaded content."
              status={getRequirementStatus("detection")}
            />

            <RequirementRow
              label="Pose Estimation Model"
              description="Identifies body position and movement."
              status={getRequirementStatus("pose")}
            />
          </section>

          {status === "installing" && (
            <section className="space-y-3" aria-label="Model cache progress">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {currentModel
                      ? `Caching ${currentModel}`
                      : "Preparing vision models"}
                  </p>

                  <p className="text-xs text-[var(--text-secondary)]">
                    Keep this page open until caching is complete.
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
                  Model {currentModel === "Pose Estimation Model" ? "2" : "1"}{" "}
                  of {MODELS.length}
                </span>
              </div>
            </section>
          )}

          {status === "error" && error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === "ready" && (
            <Alert>
              <AlertDescription>
                Vision models are cached and ready. You can continue to the
                session.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {status === "ready" ? (
            <Button onClick={() => router.push("/VisionModel")}>
              Continue
            </Button>
          ) : (
            <Button onClick={prepareModels} disabled={status === "installing"}>
              {status === "installing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caching Models
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {status === "error" ? "Try Again" : "Verify & Cache Models"}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
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
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </p>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <Badge
        variant="outline"
        className="shrink-0 text-[var(--text-secondary)]"
      >
        {status}
      </Badge>
    </div>
  );
}
