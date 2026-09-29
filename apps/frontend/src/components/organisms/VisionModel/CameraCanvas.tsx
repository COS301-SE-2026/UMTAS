"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BookOpen, CircleX } from "lucide-react";
import { detectionManager } from "../../../../utilities/VisionModel/detectionManager";
import { detection_data_manager } from "../../../../utilities/VisionModel/detection_data_manager";
import {
  DetectedPerson,
  Keypoint,
  SessionInferenceResult,
  VisionModelSize,
} from "../../../../utilities/VisionModel/messageTypes";
import { pose_Manager } from "../../../../utilities/VisionModel/pose_manager";
import { pose_data_manager } from "../../../../utilities/VisionModel/pose_data_manager";
import SessionStorePose from "../../../../utilities/VisionModel/sessionStore/poseSessionStore";
import { Button } from "@/components/atoms/baseShadcn/button";
import Popup from "@/components/atoms/utility/floatContainer";
import CreateVmSession from "./createSession";
import {
  getSingleSessionQuery,
  patchSessionMut,
} from "../../../../utilities/VisionModel/backend/persistance";
import { useMutation, useQuery } from "@tanstack/react-query";
import VM_GUIDE from "@/app/VisionModel/setup/setupGuide";

const KEY_SCORE_THRESHOLD = 0.15;

export function drawSegment(
  ctx: CanvasRenderingContext2D,
  kp1?: Keypoint,
  kp2?: Keypoint,
) {
  if (
    kp1 &&
    kp2 &&
    kp1.score > KEY_SCORE_THRESHOLD &&
    kp2.score > KEY_SCORE_THRESHOLD
  ) {
    ctx.beginPath();
    ctx.moveTo(kp1.x, kp1.y);
    ctx.lineTo(kp2.x, kp2.y);
    ctx.stroke();
  }
}

export function drawPoint(ctx: CanvasRenderingContext2D, kp?: Keypoint) {
  if (kp && kp.score > KEY_SCORE_THRESHOLD) {
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 1.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

const MODEL_COORDINATE_SIZE = 640;

function getVideoConstraints(deviceId?: string): MediaStreamConstraints {
  const isMobile = window.innerWidth < 768;

  return {
    video: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      width: isMobile ? { ideal: 1080 } : { ideal: 1920 },
      height: isMobile ? { ideal: 1920 } : { ideal: 1080 },
      ...(!deviceId ? { facingMode: isMobile ? "user" : "environment" } : {}),
    },
    audio: false,
  };
}

function drawScaledSegment(
  ctx: CanvasRenderingContext2D,
  kp1: Keypoint | undefined,
  kp2: Keypoint | undefined,
  scaleX: number,
  scaleY: number,
) {
  if (
    kp1 &&
    kp2 &&
    kp1.score > KEY_SCORE_THRESHOLD &&
    kp2.score > KEY_SCORE_THRESHOLD
  ) {
    ctx.beginPath();
    ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY);
    ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY);
    ctx.stroke();
  }
}

function drawScaledPoint(
  ctx: CanvasRenderingContext2D,
  kp: Keypoint | undefined,
  scaleX: number,
  scaleY: number,
  visualScale: number,
) {
  if (kp && kp.score > KEY_SCORE_THRESHOLD) {
    ctx.beginPath();
    ctx.arc(kp.x * scaleX, kp.y * scaleY, 2 * visualScale, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export interface DetectionSettings {
  runDetection: boolean;
  DetectionInterval: number;
}

export interface InferenceSettings {
  runInference: boolean;
  InferenceInterval: number;
}

interface CanvasCamProps {
  isCameraActive: boolean;
  detectionSettings: DetectionSettings;
  inferenceSettings: InferenceSettings;
  imageFile: File | null;
  deviceId?: string;
  modelSize: VisionModelSize;
}

export default function CameraCanvas({
  isCameraActive,
  imageFile,
  detectionSettings,
  inferenceSettings,
  deviceId,
  modelSize,
}: CanvasCamProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
        <div className="flex h-full w-full">
          <CanvasWebcam
            imageFile={imageFile}
            isCameraActive={isCameraActive}
            detectionSettings={detectionSettings}
            inferenceSettings={inferenceSettings}
            deviceId={deviceId}
            modelSize={modelSize}
          />
        </div>
      </div>
    </div>
  );
}

function CanvasWebcam({
  isCameraActive,
  detectionSettings,
  imageFile,
  inferenceSettings,
  deviceId,
  modelSize,
}: CanvasCamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loadedCameraKey, setLoadedCameraKey] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [createSessionPop, setCreateSessionPop] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const detectedPeopleRef = useRef<DetectedPerson[]>([]);
  const frameStore = useRef<SessionStorePose | null>(null);
  const lastDetectionRunRef = useRef<number>(0);
  const lastInferenceRunRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const detectionImageProcessedRef = useRef<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const inferenceImageProcessedRef = useRef<boolean>(false);
  const { data: singleSession } = useQuery(
    getSingleSessionQuery({ sessionId: sessionID ?? "" }),
  );
  const { mutateAsync: updateSession, isPending: pendingPatch } =
    useMutation(patchSessionMut());
  const saveErrorShownRef = useRef(false);
  function getCameraErrorMessage(error: unknown): string {
    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          return "Camera access was blocked. Allow camera access in your browser and try again.";
        case "NotFoundError":
          return "The selected camera is no longer available.";
        case "NotReadableError":
          return "The camera is busy or could not be opened. Close other apps or browser tabs using it and try again.";
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
  // Manage detection workers
  // Lazy initialize frameStore once
  useEffect(() => {
    const isSourceActive = isCameraActive || imageFile !== null;
    if (detectionSettings.runDetection && isSourceActive) {
      detectionImageProcessedRef.current = false;
      detectionManager.start();
      detection_data_manager.start();
    } else {
      detectedPeopleRef.current = [];
      detectionManager.terminate();
      detection_data_manager.terminate();
    }
    if (inferenceSettings.runInference && isSourceActive) {
      frameStore.current = new SessionStorePose();
      inferenceImageProcessedRef.current = false;
      pose_Manager.start();
      pose_data_manager.start();
    } else {
      pose_Manager.terminate();
      pose_data_manager.terminate();
    }
  }, [
    detectionSettings.runDetection,
    inferenceSettings.runInference,
    isCameraActive,
    imageFile,
    modelSize,
  ]);
  useEffect(() => {
    if (!imageFile) {
      imageRef.current = null;
      // eslint-disable-next-line
      setImageLoaded(false);
      detectedPeopleRef.current = [];
      detectionImageProcessedRef.current = false;
      inferenceImageProcessedRef.current = false;
      return;
    }
    detectedPeopleRef.current = [];
    lastDetectionRunRef.current = 0;
    lastInferenceRunRef.current = 0;
    detectionImageProcessedRef.current = false;
    inferenceImageProcessedRef.current = false;
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);
    img.src = objectUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageLoaded(false);
      toast.error("Image could not be loaded", {
        description: "Choose a different image and try again.",
      });
    };
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);
  const cameraKey = deviceId || "__default__";
  const cameraLoaded =
    isCameraActive && imageFile === null && loadedCameraKey === cameraKey;
  useEffect(() => {
    if (imageFile || !isCameraActive) {
      return;
    }
    let cancelled = false;
    let currentStream: MediaStream | null = null;
    const videoElement = videoRef.current;
    async function startCam() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser does not support camera access.");
        }
        currentStream = await navigator.mediaDevices.getUserMedia(
          getVideoConstraints(deviceId),
        );
        if (cancelled) {
          currentStream.getTracks().forEach((track) => track.stop());
          return;
        }
        setCameraError(null);
        if (videoElement) {
          videoElement.srcObject = currentStream;
          videoElement.onloadedmetadata = () => {
            void videoElement
              .play()
              .then(() => {
                if (!cancelled) {
                  setLoadedCameraKey(cameraKey);
                }
              })
              .catch((error) => {
                const message = getCameraErrorMessage(error);
                setLoadedCameraKey(null);
                setCameraError(message);
                toast.error("Camera preview could not start", {
                  description: message,
                });
              });
          };
        }
      } catch (error) {
        console.error("Camera start failed:", error);
        setLoadedCameraKey(null);
        const message = getCameraErrorMessage(error);
        setCameraError(message);
        toast.error("Camera could not start", {
          description: message,
        });
      }
    }
    void startCam();
    return () => {
      cancelled = true;
      if (videoElement) {
        videoElement.onloadedmetadata = null;
        if (videoElement.srcObject === currentStream) {
          videoElement.srcObject = null;
        }
      }
      currentStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraKey, deviceId, imageFile, isCameraActive]);
  useEffect(() => {
    const isReady = imageFile ? imageLoaded : cameraLoaded;
    if (!isReady) return;
    let animationFrameID: number;
    function renderFrame(timestamp: number) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const img = imageRef.current;
      if (canvas) {
        const sourceWidth = imageFile ? img?.naturalWidth : video?.videoWidth;
        const sourceHeight = imageFile
          ? img?.naturalHeight
          : video?.videoHeight;

        if (sourceWidth && sourceHeight) {
          if (canvas.width !== sourceWidth || canvas.height !== sourceHeight) {
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;
          }
        }

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          if (imageFile && img) {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          } else if (video) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          const scaleX = canvas.width / MODEL_COORDINATE_SIZE;
          const scaleY = canvas.height / MODEL_COORDINATE_SIZE;
          const visualScale = Math.max(1, Math.min(scaleX, scaleY));

          const detectionIntervalMs =
            detectionSettings.DetectionInterval * 1000;
          const inferenceIntervalMs =
            inferenceSettings.InferenceInterval * 1000;
          const shouldRunDetectionForImage = imageFile
            ? !detectionImageProcessedRef.current
            : true;
          if (
            detectionSettings.runDetection &&
            shouldRunDetectionForImage &&
            timestamp - lastDetectionRunRef.current >= detectionIntervalMs
          ) {
            lastDetectionRunRef.current = timestamp;
            if (imageFile) {
              detectionImageProcessedRef.current = true;
            }
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            detectionManager
              .run(imageData.data, canvas.width, canvas.height, modelSize)
              .then((results) => {
                if (results) {
                  detection_data_manager.run(results).then((people) => {
                    if (people) {
                      detectedPeopleRef.current = people;
                    }
                  });
                }
              });
          }

          const shouldRunInferenceForImage = imageFile || isCameraActive;

          if (
            inferenceSettings.runInference &&
            shouldRunInferenceForImage &&
            timestamp - lastInferenceRunRef.current >= inferenceIntervalMs
          ) {
            lastInferenceRunRef.current = timestamp;
            if (imageFile) {
              inferenceImageProcessedRef.current = true;
            }
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            pose_Manager
              .run(imageData.data, canvas.width, canvas.height, modelSize)
              .then((results) => {
                if (results) {
                  pose_data_manager.run(results).then((people) => {
                    if (people) {
                      const frame = ++frameCounterRef.current;
                      if (frameStore.current?.getNumFrames() === 0) {
                        frameStore.current.sendFirst(frame, timestamp, people);
                      } else {
                        frameStore.current?.sendData(frame, timestamp, people);
                      }
                    }
                  });
                }
              });
          }
          if (detectionSettings.runDetection) {
            for (const person of detectedPeopleRef.current) {
              context.strokeStyle = "#00ff00";
              context.lineWidth = Math.max(2, 1.5 * visualScale);
              context.strokeRect(
                person.top_left_x * scaleX,
                person.top_left_y * scaleY,
                person.width * scaleX,
                person.height * scaleY,
              );
            }
          }
          if (inferenceSettings.runInference) {
            for (const frameOfPeople of frameStore.current?.getLastFrame()
              ?.people ?? []) {
              const data = frameOfPeople.pose_data;
              const gaze = frameOfPeople.gaze;
              if (frameCounterRef.current - frameOfPeople.last_seen_frame > 5) {
                continue;
              }
              context.fillStyle = "#00ff00";
              context.font = `${Math.min(24, 14 * visualScale)}px sans-serif`;
              context.fillText(
                `ID ${frameOfPeople.assigned_id.toString()}`,
                data.person.top_left_x * scaleX,
                Math.max(data.person.top_left_y * scaleY - 5, 15),
              );
              context.strokeStyle = "#00ffff";
              context.fillStyle = "#00ffff";
              context.lineWidth = Math.max(2, 2 * visualScale);
              const leftElbow = data.left_arm?.[0];
              const leftWrist = data.left_arm?.[1];
              const rightElbow = data.right_arm?.[0];
              const rightWrist = data.right_arm?.[1];
              drawScaledSegment(
                context,
                data.left_shoulder,
                data.center_mass,
                scaleX,
                scaleY,
              );
              drawScaledSegment(
                context,
                data.right_shoulder,
                data.center_mass,
                scaleX,
                scaleY,
              );
              drawScaledSegment(
                context,
                data.left_shoulder,
                leftElbow,
                scaleX,
                scaleY,
              );
              drawScaledSegment(context, leftElbow, leftWrist, scaleX, scaleY);
              drawScaledSegment(
                context,
                data.right_shoulder,
                rightElbow,
                scaleX,
                scaleY,
              );
              drawScaledSegment(
                context,
                rightElbow,
                rightWrist,
                scaleX,
                scaleY,
              );
              drawScaledSegment(
                context,
                data.nose,
                data.center_mass,
                scaleX,
                scaleY,
              );
              drawScaledPoint(context, data.nose, scaleX, scaleY, visualScale);
              drawScaledPoint(
                context,
                data.center_mass,
                scaleX,
                scaleY,
                visualScale,
              );
              drawScaledPoint(
                context,
                data.left_shoulder,
                scaleX,
                scaleY,
                visualScale,
              );
              drawScaledPoint(context, leftElbow, scaleX, scaleY, visualScale);
              drawScaledPoint(context, leftWrist, scaleX, scaleY, visualScale);
              drawScaledPoint(
                context,
                data.right_shoulder,
                scaleX,
                scaleY,
                visualScale,
              );
              drawScaledPoint(context, rightElbow, scaleX, scaleY, visualScale);
              drawScaledPoint(context, rightWrist, scaleX, scaleY, visualScale);
              if (gaze) {
                const noseX = data.nose.x * scaleX;
                const noseY = data.nose.y * scaleY;
                if (gaze.looking_straight) {
                  const xSize = 5 * visualScale;
                  context.beginPath();
                  context.strokeStyle = "#ff3333";
                  context.lineWidth = Math.max(2, 2 * visualScale);
                  context.moveTo(noseX - xSize, noseY - xSize);
                  context.lineTo(noseX + xSize, noseY + xSize);
                  context.moveTo(noseX - xSize, noseY + xSize);
                  context.lineTo(noseX + xSize, noseY - xSize);
                  context.stroke();
                } else if (gaze.looking_left || gaze.looking_right) {
                  const lineLength = 25 * visualScale;
                  const directionMultiplier = gaze.looking_left ? -1 : 1;
                  context.beginPath();
                  context.strokeStyle = "#ffcc00";
                  context.lineWidth = Math.max(3, 3 * visualScale);
                  context.moveTo(noseX, noseY);
                  context.lineTo(
                    noseX + lineLength * directionMultiplier,
                    noseY,
                  );
                  context.stroke();
                }
              }
            }
          }
        }
      }
      animationFrameID = requestAnimationFrame(renderFrame);
    }
    animationFrameID = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animationFrameID);
    };
  }, [
    isCameraActive,
    modelSize,
    cameraLoaded,
    imageLoaded,
    imageFile,
    detectionSettings,
    inferenceSettings,
  ]);
  const [sessionRes, SetSessionRes] = useState<SessionInferenceResult>({
    total_restless_frames: 0,
    total_stable_frames: 0,
    questions_asked: 0,
    total_frames: 0,
    total_no_attention: 0,
    total_paying_attention: 0,
  });
  const totalRestlessFramesCount =
    sessionRes.total_restless_frames + sessionRes.total_stable_frames;

  const percentageStable =
    totalRestlessFramesCount > 0
      ? (sessionRes.total_stable_frames / totalRestlessFramesCount) * 100
      : 0.0;

  const percentageNotStable =
    totalRestlessFramesCount > 0
      ? (sessionRes.total_restless_frames / totalRestlessFramesCount) * 100
      : 0.0;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if ((cameraLoaded || imageLoaded) && inferenceSettings.runInference) {
      interval = setInterval(async () => {
        if (!frameStore.current) return;
        try {
          const result = await frameStore.current.analyseAllFrames();
          if (singleSession && !pendingPatch) {
            const apiRes = await updateSession({
              body: {
                Data: result,
              },
              path: { sessionId: singleSession.session.SessionID },
            });
            SetSessionRes(apiRes.session.Data);
          } else {
            SetSessionRes(result);
          }
          saveErrorShownRef.current = false;
        } catch (error) {
          console.error("Could not update Lecture Watch results:", error);
          if (!saveErrorShownRef.current) {
            saveErrorShownRef.current = true;
            toast.error("Results could not be saved", {
              description:
                "Lecture analysis is still running, but the latest results could not be saved.",
            });
          }
        }
      }, 3 * 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    cameraLoaded,
    imageLoaded,
    inferenceSettings.runInference,
    pendingPatch,
    singleSession,
    updateSession,
  ]);
  const showCanvas = imageFile !== null || cameraLoaded;
  return (
    <>
      <div className="flex h-full w-full flex-col gap-4">
        <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
          <video ref={videoRef} playsInline muted className="hidden"></video>
          {showCanvas ? (
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="block h-auto w-full rounded-xl"
            ></canvas>
          ) : isCameraActive && cameraError ? (
            <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-2 px-6 text-center text-[var(--text-secondary)]">
              <CircleX className="h-6 w-6" aria-hidden="true" />
              <p className="font-medium text-[var(--text-primary)]">
                Camera unavailable
              </p>
              <p className="max-w-md text-sm">{cameraError}</p>
            </div>
          ) : isCameraActive ? (
            <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-[var(--text-secondary)]">
              Starting camera…
            </div>
          ) : (
            <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-2 px-6 text-center text-[var(--text-secondary)]">
              <CircleX className="h-6 w-6" aria-hidden="true" />
              <p className="font-medium text-[var(--text-primary)]">
                No input selected
              </p>
              <p className="text-sm">
                Turn on the camera or upload an image to begin.
              </p>
            </div>
          )}
        </div>

        <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text-primary)]">
                {singleSession
                  ? `Session: ${singleSession.session.SessionName}`
                  : "No Active Session"}
              </h2>
              {singleSession && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Your results will be automatically saved
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowGuide(true)}
              >
                <BookOpen />
                Setup Guide
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={pendingPatch}
                onClick={async () => {
                  const emptyResults = {
                    questions_asked: 0,
                    total_frames: 0,
                    total_no_attention: 0,
                    total_paying_attention: 0,
                    total_restless_frames: 0,
                    total_stable_frames: 0,
                  };
                  try {
                    if (singleSession && !pendingPatch) {
                      await updateSession({
                        body: { Data: emptyResults },
                        path: { sessionId: singleSession.session.SessionID },
                      });
                    }
                    frameStore.current?.clear();
                    detectionImageProcessedRef.current = false;
                    inferenceImageProcessedRef.current = false;
                    SetSessionRes(emptyResults);
                    toast.success("Results reset");
                  } catch (error) {
                    console.error("Could not reset results:", error);
                    toast.error("Results could not be reset", {
                      description: "Please try again.",
                    });
                  }
                }}
              >
                Reset Results
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setCreateSessionPop(true)}
              >
                {singleSession ? "Change Session" : "Select Session"}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="mb-3 text-xs font-semibold text-[var(--text-secondary)]">
              Results
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)]">
                  Questions asked
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {sessionRes.questions_asked}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)]">
                  Paying attention
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {sessionRes.total_frames > 0
                    ? `${((sessionRes.total_paying_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                    : "0.00%"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)]">
                  Not paying attention
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {sessionRes.total_frames > 0
                    ? `${((sessionRes.total_no_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                    : "0.00%"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)]">
                  Sitting still
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {`${percentageStable.toFixed(2)}%`}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)]">Restless</p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {`${percentageNotStable.toFixed(2)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showGuide && (
        <Popup onClose={() => setShowGuide(false)}>
          <VM_GUIDE></VM_GUIDE>
        </Popup>
      )}
      {createSessionPop == true && (
        <Popup
          onClose={() => {
            setCreateSessionPop(false);
          }}
        >
          <CreateVmSession
            updateSessionID={(id: string) => {
              setSessionID(id);
              setCreateSessionPop(false);
            }}
          />
        </Popup>
      )}
    </>
  );
}
