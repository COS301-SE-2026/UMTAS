"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import Popup from "@/components/atoms/utility/floatContainer";
import CameraCanvas, {
  DetectionSettings,
  InferenceSettings,
} from "@/components/organisms/VisionModel/CameraCanvas";
import VideoUploadComp from "@/components/organisms/VisionModel/videoUpload";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MODEL_READY_KEY = "vision-model-ready";
const MODEL_SETUP_ROUTE = "/VisionModel/setup";

export default function VM_SessionTemplate() {
  const router = useRouter();

  const [modelVerified, setModelVerified] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [sessionId, setSessionID] = useState<string | null>(null);

  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(
    {
      runDetection: false,
      DetectionInterval: 0,
    },
  );

  const [inferenceSettings, setInferenceSettings] = useState<InferenceSettings>(
    {
      runInference: false,
      InferenceInterval: 0,
    },
  );

  const [imageUpload, setImageUpload] = useState<File | null>(null);

  const [showVideoPopUp, setShowVideoPopUp] = useState(false);

  const uploadImageRef = useRef<HTMLInputElement>(null);

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

  if (!modelVerified) {
    return null;
  }

  return (
    <>
      <main className="flex w-full justify-center px-4 py-4">
        <Card className="w-full max-w-7xl overflow-hidden border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <CardHeader className="space-y-1 border-b border-[var(--border)]">
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Session Camera
            </CardTitle>

            <CardDescription className="text-sm text-[var(--text-secondary)]">
              Configure the camera, upload media and control vision model
              processing.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Camera / image preview */}
            <section
              aria-label="Vision preview"
              className="overflow-hidden rounded-lg border w-full "
            >
              <div className="mx-auto w-full max-w-5xl md:aspect-video">
                <CameraCanvas
                  isCameraActive={cameraOn}
                  detectionSettings={detectionSettings}
                  inferenceSettings={inferenceSettings}
                  imageFile={imageUpload}
                />
              </div>
            </section>

            {/* Settings */}
            <section
              aria-label="Vision session settings"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {/* Upload */}
              <SettingsCard
                title="Media"
                description="Use an uploaded image or video as the input source."
              >
                <div className="flex flex-col gap-2">
                  <Button
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

                      setImageUpload(null);
                      setShowVideoPopUp(true);
                    }}
                  >
                    Upload Video
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (imageUpload === null) {
                        uploadImageRef.current?.click();
                      } else {
                        setImageUpload(null);
                      }
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

                      if (file) {
                        setImageUpload(file);
                        setCameraOn(false);
                      }
                    }}
                  />

                  {imageUpload && (
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {imageUpload.name}
                    </p>
                  )}
                </div>
              </SettingsCard>

              {/* Camera */}
              <SettingsCard
                title="Camera"
                description="Choose whether the live camera feed is active."
              >
                <SettingRow label="Camera">
                  <Switch
                    checked={cameraOn}
                    aria-label="Toggle camera"
                    onCheckedChange={(checked) => {
                      setCameraOn(checked);
                      setImageUpload(null);
                    }}
                  />
                </SettingRow>
              </SettingsCard>

              {/* Detection */}
              <SettingsCard
                title="Detection"
                description="Detect people within the current input source."
              >
                <div className="space-y-4">
                  <SettingRow label="Detection">
                    <Switch
                      checked={detectionSettings.runDetection}
                      aria-label="Toggle detection"
                      onCheckedChange={(checked) => {
                        setInferenceSettings((settings) => ({
                          ...settings,
                          runInference: false,
                        }));

                        setDetectionSettings((settings) => ({
                          ...settings,
                          runDetection: checked,
                        }));
                      }}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <Label
                      htmlFor="detection-interval"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Interval
                    </Label>

                    <Input
                      id="detection-interval"
                      value={detectionSettings.DetectionInterval}
                      onChange={(event) => {
                        setDetectionSettings((settings) => ({
                          ...settings,
                          DetectionInterval: Number(event.target.value),
                        }));
                      }}
                      min={0}
                      max={100}
                      step={0.2}
                      type="number"
                      placeholder="0"
                      className="w-full"
                    />

                    <p className="text-xs text-[var(--text-secondary)]">
                      Time between detection runs in seconds.
                    </p>
                  </div>
                </div>
              </SettingsCard>

              {/* Inference */}
              <SettingsCard
                title="Inference"
                description="Run pose estimation and session analysis."
              >
                <div className="space-y-4">
                  <SettingRow label="Inference">
                    <Switch
                      checked={inferenceSettings.runInference}
                      aria-label="Toggle inference"
                      onCheckedChange={(checked) => {
                        setInferenceSettings((settings) => ({
                          ...settings,
                          runInference: checked,
                        }));

                        setDetectionSettings((settings) => ({
                          ...settings,
                          runDetection: false,
                        }));
                      }}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <Label
                      htmlFor="inference-interval"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Interval
                    </Label>

                    <Input
                      id="inference-interval"
                      value={inferenceSettings.InferenceInterval}
                      onChange={(event) => {
                        setInferenceSettings((settings) => ({
                          ...settings,
                          InferenceInterval: Number(event.target.value),
                        }));
                      }}
                      min={0}
                      max={100}
                      step={0.2}
                      type="number"
                      placeholder="0"
                      className="w-full"
                    />

                    <p className="text-xs text-[var(--text-secondary)]">
                      Time between inference runs in seconds.
                    </p>
                  </div>
                </div>
              </SettingsCard>
            </section>
          </CardContent>
        </Card>
      </main>

      {showVideoPopUp && (
        <Popup onClose={() => setShowVideoPopUp(false)}>
          <VideoUploadComp />
        </Popup>
      )}
    </>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="mb-4">
        <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-[1.5] text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <div className="mt-auto">{children}</div>
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
