"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleX } from "lucide-react";
import { detectionManager } from "../../../../utilities/VisionModel/detectionManager";
import { detection_data_manager } from "../../../../utilities/VisionModel/detection_data_manager";
import {
  DetectedPerson,
  Keypoint,
  SessionInferenceResult,
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

function getVideoConstraints(deviceId?: string): MediaStreamConstraints {
  const isMobile = window.innerWidth < 768;
  return {
    video: deviceId
      ? { deviceId: { exact: deviceId } }
      : {
          width: isMobile ? { ideal: 720 } : { ideal: 1280 },
          height: isMobile ? { ideal: 1280 } : { ideal: 720 },
          facingMode: isMobile ? "user" : "environment",
        },
    audio: false,
  };
}

function getCanvasConstraints() {
  return {
    width: 640,
    height: 640,
  };
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
}

export default function CameraCanvas({
  isCameraActive,
  imageFile,
  detectionSettings,
  inferenceSettings,
  deviceId,
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
  const lastRunRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const imageProcessedRef = useRef<boolean>(false);
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
      detectionManager.start();
      detection_data_manager.start();
    } else {
      detectedPeopleRef.current = [];
      detectionManager.terminate();
      detection_data_manager.terminate();
    }
    if (inferenceSettings.runInference && isSourceActive) {
      frameStore.current = new SessionStorePose();
      imageProcessedRef.current = false;
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
  ]);
  useEffect(() => {
    if (!imageFile) {
      imageRef.current = null;
      // eslint-disable-next-line
      setImageLoaded(false);
      detectedPeopleRef.current = [];
      imageProcessedRef.current = false;
      return;
    }
    detectedPeopleRef.current = [];
    lastRunRef.current = 0;
    imageProcessedRef.current = false;
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
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          if (imageFile && img) {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          } else if (video) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          const detectionIntervalMs =
            detectionSettings.DetectionInterval * 1000;
          const inferenceIntervalMs =
            inferenceSettings.InferenceInterval * 1000;
          const shouldRunForImage = imageFile
            ? !imageProcessedRef.current
            : true;
          if (
            detectionSettings.runDetection &&
            shouldRunForImage &&
            timestamp - lastRunRef.current >= detectionIntervalMs
          ) {
            lastRunRef.current = timestamp;
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            detectionManager
              .run(imageData?.data, canvas.width, canvas.height)
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
          if (
            inferenceSettings.runInference &&
            shouldRunForImage &&
            timestamp - lastRunRef.current >= inferenceIntervalMs
          ) {
            lastRunRef.current = timestamp;
            if (imageFile) {
              imageProcessedRef.current = true;
            }
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            pose_Manager
              .run(imageData?.data, canvas.width, canvas.height)
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
              context.lineWidth = 1.2;
              context.strokeRect(
                person.top_left_x,
                person.top_left_y,
                person.width,
                person.height,
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
              context.font = "14px sans-serif";
              context.fillText(
                `ID ${frameOfPeople.assigned_id.toString()}`,
                data.person.top_left_x,
                Math.max(data.person.top_left_y - 5, 15),
              );
              context.strokeStyle = "#00ffff";
              context.fillStyle = "#00ffff";
              context.lineWidth = 2;
              const leftElbow = data.left_arm?.[0];
              const leftWrist = data.left_arm?.[1];
              const rightElbow = data.right_arm?.[0];
              const rightWrist = data.right_arm?.[1];
              drawSegment(context, data.left_shoulder, data.center_mass);
              drawSegment(context, data.right_shoulder, data.center_mass);
              drawSegment(context, data.left_shoulder, leftElbow);
              drawSegment(context, leftElbow, leftWrist);
              drawSegment(context, data.right_shoulder, rightElbow);
              drawSegment(context, rightElbow, rightWrist);
              drawSegment(context, data.nose, data.center_mass);
              drawPoint(context, data.nose);
              drawPoint(context, data.center_mass);
              drawPoint(context, data.left_shoulder);
              drawPoint(context, leftElbow);
              drawPoint(context, leftWrist);
              drawPoint(context, data.right_shoulder);
              drawPoint(context, rightElbow);
              drawPoint(context, rightWrist);
              if (gaze) {
                const noseX = data.nose.x;
                const noseY = data.nose.y;
                if (gaze.looking_straight) {
                  const xSize = 5;
                  context.beginPath();
                  context.strokeStyle = "#ff3333";
                  context.lineWidth = 2;
                  context.moveTo(noseX - xSize, noseY - xSize);
                  context.lineTo(noseX + xSize, noseY + xSize);
                  context.moveTo(noseX - xSize, noseY + xSize);
                  context.lineTo(noseX + xSize, noseY - xSize);
                  context.stroke();
                } else if (gaze.looking_left || gaze.looking_right) {
                  const lineLength = 25;
                  const directionMultiplier = gaze.looking_left ? -1 : 1;
                  context.beginPath();
                  context.strokeStyle = "#ffcc00";
                  context.lineWidth = 3;
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
      <div className="grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 lg:col-span-3">
          <video ref={videoRef} playsInline muted className="hidden"></video>
          {showCanvas ? (
            <canvas
              ref={canvasRef}
              width={getCanvasConstraints().width}
              height={getCanvasConstraints().height}
              className="w-full h-full max-h-[75vh] object-contain rounded-xl"
            ></canvas>
          ) : isCameraActive && cameraError ? (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 px-6 text-center text-[var(--text-secondary)]">
              <CircleX className="h-6 w-6" aria-hidden="true" />
              <p className="font-medium text-[var(--text-primary)]">
                Camera unavailable
              </p>
              <p className="max-w-md text-sm">{cameraError}</p>
            </div>
          ) : isCameraActive ? (
            <div className="flex h-[60vh] w-full items-center justify-center text-sm text-[var(--text-secondary)]">
              Starting camera…
            </div>
          ) : (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 px-6 text-center text-[var(--text-secondary)]">
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
        <div className="flex w-full flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm lg:col-span-1">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
                {singleSession ? (
                  <>Session: {` ${singleSession?.session.SessionName}`} </>
                ) : (
                  <>No Active Session</>
                )}
              </h2>
              {singleSession && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Your results will be automatically saved
                </p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                Results
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-[var(--text-secondary)]">
                <span>Questions asked:</span>
                <span className="font-medium text-[var(--text-primary)] text-right">
                  {sessionRes.questions_asked}
                </span>
                <span>Paying attention:</span>
                <span className="font-medium text-[var(--text-primary)] text-right">
                  {sessionRes.total_frames > 0
                    ? `${((sessionRes.total_paying_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                    : "0.00%"}
                </span>
                <span>Not Paying attention:</span>
                <span className="font-medium text-[var(--text-primary)] text-right">
                  {sessionRes.total_frames > 0
                    ? `${((sessionRes.total_no_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                    : "0.00%"}
                </span>
                <span>Sitting still:</span>
                <span className="font-medium text-[var(--text-primary)] text-right">
                  {`${percentageStable.toFixed(2)}%`}
                </span>
                <span>Restless:</span>
                <span className="font-medium text-[var(--text-primary)] text-right">
                  {`${percentageNotStable.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex w-full gap-2 border-t border-[var(--border)] pt-6">
            <Button
              variant="outline"
              className="flex-1"
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
                  imageProcessedRef.current = false;
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
              className="flex-1"
              onClick={() => setCreateSessionPop(true)}
            >
              {singleSession ? "Change Session" : "Select Session"}
            </Button>
          </div>
        </div>
      </div>
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
