"use client";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import Popup from "@/components/atoms/utility/floatContainer";
import CameraCanvas, {
  DetectionSettings,
  InferenceSettings,
} from "@/components/organisms/VisionModel/CameraCanvas";
import VideoUploadComp from "@/components/organisms/VisionModel/videoUpload";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { VisionModelSize } from "../../../../utilities/VisionModel/messageTypes";
import Tutorial from "@/components/organisms/nav/Tutorial";

const steps = [
  {
    target: "#btn-analyse-video",
    content: "Analyse a video file using the vision model.",
  },
  {
    target: "#btn-upload-image",
    content: "Upload an image to use as the analysis input.",
  },
  {
    target: "#switch-live-camera",
    content: "Turn on the camera to use a live video input.",
  },
  {
    target: "#vision-model-select",
    content:
      "Choose the vision model based on the speed and accuracy you need.",
  },
  {
    target: "#switch-people-detection",
    content: "Enable people detection to find and track people in the input.",
  },
  {
    target: "#switch-lecture-analysis",
    content:
      "Enable lecture analysis to analyse attention, movement and participation.",
  },
];

const MODEL_READY_KEY = "vision-model-ready-v3";
const MODEL_SETUP_ROUTE = "/VisionModel/setup";

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "Camera access was blocked. Allow camera access in your browser and try again.";
      case "NotFoundError":
        return "No camera was found on this device.";
      case "NotReadableError":
        return "The camera is busy or could not be opened. Close other apps or tabs using it and try again.";
      case "OverconstrainedError":
        return "The selected camera does not support the requested settings. Try another camera.";
      default:
        return error.message || "The camera could not be opened.";
    }
  }

  return error instanceof Error
    ? error.message
    : "The camera could not be opened.";
}

export default function VM_SessionTemplate() {
  const router = useRouter();

  const [modelVerified, setModelVerified] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [modelSize, setModelSize] = useState<VisionModelSize>("nano");

  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(
    {
      runDetection: false,
      DetectionInterval: 0.5,
    },
  );

  const [inferenceSettings, setInferenceSettings] = useState<InferenceSettings>(
    {
      runInference: false,
      InferenceInterval: 0.5,
    },
  );

  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [showVideoPopUp, setShowVideoPopUp] = useState(false);
  const [modelEnabled, setModelEnabled] = useState(true);

  const uploadImageRef = useRef<HTMLInputElement>(null);

  const hasInput = cameraOn || imageUpload !== null;

  useEffect(() => {
    const modelReady = localStorage.getItem(MODEL_READY_KEY) === "true";

    if (!modelReady) {
      router.replace(MODEL_SETUP_ROUTE);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setModelVerified(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [router]);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;

    const refreshDevices = async () => {
      if (!cameraOn) return;

      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(
          (device) => device.kind === "videoinput",
        );

        setDevices(videoDevices);

        if (
          selectedDeviceId &&
          !videoDevices.some((device) => device.deviceId === selectedDeviceId)
        ) {
          setSelectedDeviceId(videoDevices[0]?.deviceId ?? "");
        }
      } catch (error) {
        console.error("Could not refresh camera devices:", error);
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        refreshDevices,
      );
    };
  }, [cameraOn, selectedDeviceId]);

  async function handleCameraToggle(checked: boolean) {
    if (!checked) {
      setCameraOn(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera unavailable", {
        description: "This browser does not support camera access.",
      });
      return;
    }

    setCameraStarting(true);

    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      permissionStream.getTracks().forEach((track) => track.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(
        (device) => device.kind === "videoinput",
      );

      if (videoDevices.length === 0) {
        throw new DOMException("No camera found", "NotFoundError");
      }

      setDevices(videoDevices);

      if (
        !selectedDeviceId ||
        !videoDevices.some((device) => device.deviceId === selectedDeviceId)
      ) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }

      if (imageUpload) {
        setImageUpload(null);
        toast.info("Switched to live camera", {
          description: "The uploaded image was removed from the preview.",
        });
      }

      setCameraOn(true);
    } catch (error) {
      console.error("Error starting camera:", error);

      toast.error("Camera could not start", {
        description: getCameraErrorMessage(error),
      });

      setCameraOn(false);
    } finally {
      setCameraStarting(false);
    }
  }

  function handleDetectionToggle(checked: boolean) {
    if (checked && !modelEnabled) {
      toast.error("Enable the vision model first");
      return;
    }

    if (checked && !hasInput) {
      toast.error("Choose an input first", {
        description: "Turn on the camera or upload an image before detection.",
      });
      return;
    }

    if (checked && inferenceSettings.runInference) {
      setInferenceSettings((settings) => ({
        ...settings,
        runInference: false,
      }));
    }

    setDetectionSettings((settings) => ({
      ...settings,
      runDetection: checked,
    }));
  }

  function handleInferenceToggle(checked: boolean) {
    if (checked && !modelEnabled) {
      toast.error("Enable the vision model first");
      return;
    }

    if (checked && !hasInput) {
      toast.error("Choose an input first", {
        description:
          "Turn on the camera or upload an image before lecture analysis.",
      });
      return;
    }

    if (checked && detectionSettings.runDetection) {
      setDetectionSettings((settings) => ({
        ...settings,
        runDetection: false,
      }));
    }

    setInferenceSettings((settings) => ({
      ...settings,
      runInference: checked,
    }));
  }

  if (!modelVerified) return null;

  return (
    <>
      <Tutorial steps={steps} wait={true} />
      <main className="w-full px-8 pt-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="w-full border-b border-[var(--border)] pb-4">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Lecture Watch
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Choose a camera, image or video, then run people detection or
              lecture analysis.
            </p>
          </div>

          <div className="space-y-6">
            <section aria-label="Vision preview" className="w-full">
              <div className="w-full">
                <CameraCanvas
                  isCameraActive={cameraOn}
                  detectionSettings={detectionSettings}
                  inferenceSettings={inferenceSettings}
                  imageFile={imageUpload}
                  deviceId={selectedDeviceId}
                  modelSize={modelSize}
                />
              </div>
            </section>

            <section
              aria-label="Vision session settings"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <SettingsCard
                title="Input"
                description="Choose what Lecture Watch should analyse."
                status={
                  imageUpload
                    ? "Image selected"
                    : cameraOn
                      ? "Live camera"
                      : "No input"
                }
              >
                <div className="mt-auto flex flex-col gap-2">
                  <Button
                    id="btn-analyse-video"
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setInferenceSettings((settings) => ({
                        ...settings,
                        runInference: false,
                      }));
                      setDetectionSettings((settings) => ({
                        ...settings,
                        runDetection: false,
                      }));
                      setCameraOn(false);
                      setImageUpload(null);
                      setShowVideoPopUp(true);
                    }}
                  >
                    Analyse Video
                  </Button>

                  <Button
                    id="btn-upload-image"
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (imageUpload === null) {
                        uploadImageRef.current?.click();
                        return;
                      }

                      setImageUpload(null);
                      setDetectionSettings((settings) => ({
                        ...settings,
                        runDetection: false,
                      }));
                      setInferenceSettings((settings) => ({
                        ...settings,
                        runInference: false,
                      }));

                      if (uploadImageRef.current) {
                        uploadImageRef.current.value = "";
                      }

                      toast.info("Image removed");
                    }}
                  >
                    {imageUpload === null ? "Upload Image" : "Remove Image"}
                  </Button>

                  <Input
                    ref={uploadImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      if (!file.type.startsWith("image/")) {
                        toast.error("Unsupported file", {
                          description: "Choose an image file to continue.",
                        });
                        return;
                      }

                      setImageUpload(file);
                      setCameraOn(false);
                      setDetectionSettings((settings) => ({
                        ...settings,
                        runDetection: false,
                      }));
                      setInferenceSettings((settings) => ({
                        ...settings,
                        runInference: false,
                      }));

                      toast.success("Image loaded", {
                        description: `${file.name} is ready for analysis.`,
                      });
                    }}
                  />

                  {imageUpload && (
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {imageUpload.name}
                    </p>
                  )}
                </div>
              </SettingsCard>

              <SettingsCard
                title="Camera Input"
                description="Use a live camera as the current input."
                status={cameraStarting ? "Starting…" : cameraOn ? "On" : "Off"}
              >
                <div className="space-y-4">
                  <SettingRow label="Live camera">
                    <div className="flex items-center gap-2">
                      {cameraStarting && (
                        <Loader2
                          className="size-4 animate-spin text-[var(--text-secondary)]"
                          aria-hidden="true"
                        />
                      )}
                      <Switch
                        id="switch-live-camera"
                        checked={cameraOn}
                        disabled={cameraStarting}
                        aria-label="Toggle camera"
                        onCheckedChange={(checked) => {
                          void handleCameraToggle(checked);
                        }}
                      />
                    </div>
                  </SettingRow>

                  <div className="space-y-2">
                    <Label
                      htmlFor="camera-select"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Camera device
                    </Label>

                    <Select
                      disabled={!cameraOn || devices.length === 0}
                      value={selectedDeviceId}
                      onValueChange={setSelectedDeviceId}
                    >
                      <SelectTrigger id="camera-select" className="w-full">
                        <SelectValue placeholder="Select a camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device, index) => (
                          <SelectItem
                            key={device.deviceId}
                            value={device.deviceId}
                          >
                            {device.label || `Camera ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-[var(--text-secondary)]">
                      If a camera is busy, close other apps or browser tabs
                      using it and try again.
                    </p>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                title="Vision Model"
                description="Choose the balance between speed and accuracy."
                status={
                  modelSize === "nano"
                    ? "Fast"
                    : modelSize === "small"
                      ? "Balanced"
                      : "Accurate"
                }
              >
                <div className="space-y-4">
                  <SettingRow label="Model selection">
                    <Switch
                      checked={modelEnabled}
                      aria-label="Toggle vision model"
                      onCheckedChange={(checked) => {
                        setModelEnabled(checked);

                        if (!checked) {
                          setDetectionSettings((settings) => ({
                            ...settings,
                            runDetection: false,
                          }));

                          setInferenceSettings((settings) => ({
                            ...settings,
                            runInference: false,
                          }));
                        }
                      }}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <Label
                      htmlFor="vision-model-select"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Model
                    </Label>

                    <Select
                      disabled={!modelEnabled}
                      value={modelSize}
                      onValueChange={(value) => {
                        setDetectionSettings((settings) => ({
                          ...settings,
                          runDetection: false,
                        }));

                        setInferenceSettings((settings) => ({
                          ...settings,
                          runInference: false,
                        }));

                        setModelSize(value as VisionModelSize);
                      }}
                    >
                      <SelectTrigger
                        id="vision-model-select"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="nano">Nano - Fast</SelectItem>
                        <SelectItem value="small">Small - Balanced</SelectItem>
                        <SelectItem value="medium">
                          Medium - Accurate
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-[var(--text-secondary)]">
                      Larger models improve accuracy but require more processing
                      power.
                    </p>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                title="People Detection"
                description="Find and track people in the current input."
                status={detectionSettings.runDetection ? "Detecting" : "Off"}
              >
                <div className="space-y-4">
                  <SettingRow label="Detection">
                    <Switch
                      id="switch-people-detection"
                      checked={detectionSettings.runDetection}
                      disabled={!hasInput || !modelEnabled}
                      aria-label="Toggle people detection"
                      onCheckedChange={handleDetectionToggle}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <Label
                      htmlFor="detection-interval"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Analysis interval
                    </Label>

                    <Input
                      id="detection-interval"
                      value={detectionSettings.DetectionInterval}
                      disabled={!hasInput || !modelEnabled}
                      onChange={(event) => {
                        const value = Math.max(0.2, Number(event.target.value));
                        setDetectionSettings((settings) => ({
                          ...settings,
                          DetectionInterval: value,
                        }));
                      }}
                      min={0.2}
                      max={100}
                      step={0.1}
                      type="number"
                      placeholder="0.5"
                      className="w-full"
                    />

                    <p className="text-xs text-[var(--text-secondary)]">
                      Seconds between detection runs. A larger value uses less
                      processing power.
                    </p>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                title="Lecture Analysis"
                description="Analyse attention, movement and participation."
                status={inferenceSettings.runInference ? "Analysing" : "Off"}
              >
                <div className="space-y-4">
                  <SettingRow label="Analysis">
                    <Switch
                      id="switch-lecture-analysis"
                      checked={inferenceSettings.runInference}
                      disabled={!hasInput || !modelEnabled}
                      aria-label="Toggle lecture analysis"
                      onCheckedChange={handleInferenceToggle}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <Label
                      htmlFor="inference-interval"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Analysis interval
                    </Label>

                    <Input
                      id="inference-interval"
                      value={inferenceSettings.InferenceInterval}
                      disabled={!hasInput || !modelEnabled}
                      onChange={(event) => {
                        const value = Math.max(0.2, Number(event.target.value));
                        setInferenceSettings((settings) => ({
                          ...settings,
                          InferenceInterval: value,
                        }));
                      }}
                      min={0.2}
                      max={100}
                      step={0.1}
                      type="number"
                      placeholder="0.5"
                      className="w-full"
                    />

                    <p className="text-xs text-[var(--text-secondary)]">
                      Seconds between analysis runs. Increase this on slower
                      devices.
                    </p>
                  </div>
                </div>
              </SettingsCard>
            </section>
          </div>
        </div>
      </main>

      {showVideoPopUp && (
        <Popup onClose={() => setShowVideoPopUp(false)}>
          <VideoUploadComp modelSize={modelSize} />
        </Popup>
      )}
    </>
  );
}

function SettingsCard({
  title,
  description,
  status,
  children,
}: {
  title: string;
  description: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="mb-4 min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h2 className="min-w-0 text-[15px] font-semibold text-[var(--text-primary)]">
            {title}
          </h2>

          {status && (
            <Badge
              variant="outline"
              className="w-24 justify-center whitespace-nowrap text-[var(--text-secondary)]"
            >
              {status}
            </Badge>
          )}
        </div>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-4">
      <Label className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </Label>

      {children}
    </div>
  );
}
