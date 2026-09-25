"use client";
import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";
import { detectionManager } from "../../../../utilities/VisionModel/detectionManager";
import { detection_data_manager } from "../../../../utilities/VisionModel/detection_data_manager";
import {
  DetectedPerson,
  DetectedPersonPose,
  Keypoint,
} from "../../../../utilities/VisionModel/messageTypes";
import { pose_Manager } from "../../../../utilities/VisionModel/pose_manager";
import { pose_data_manager } from "../../../../utilities/VisionModel/pose_data_manager";
import SessionStorePose from "../../../../utilities/VisionModel/sessionStore/poseSessionStore";

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

function getVideoConstraints(): MediaStreamConstraints {
  const isMobile = window.innerWidth < 768;
  return {
    video: {
      width: isMobile ? { ideal: 720 } : { ideal: 1280 },
      height: isMobile ? { ideal: 1280 } : { ideal: 720 },
      facingMode: isMobile ? "user" : "environment",
    },
    audio: true,
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
  DetectionInterval: number; // in seconds
}
export interface InferenceSettings {
  runInference: boolean;
  InferenceInterval: number; // in seconds
}
interface CanvasCamProps {
  isCameraActive: boolean;
  detectionSettings: DetectionSettings;
  inferenceSettings: InferenceSettings;

  imageFile: File | null;
}

export default function CameraCanvas({
  isCameraActive,
  imageFile,
  detectionSettings,
  inferenceSettings,
}: CanvasCamProps) {
  return (
    <div className="w-full min-w-fit h-full justify-around flex flex-col gap-y-4 p-4">
      <div className="w-full min-w-fit h-full flex flex-col justify-center items-center text-center border rounded-2xl ">
        <div className="w-full h-full min-w-fit justify-center items-center flex">
          <CanvasWebcam
            imageFile={imageFile}
            isCameraActive={isCameraActive}
            detectionSettings={detectionSettings}
            inferenceSettings={inferenceSettings}
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
}: CanvasCamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [cameraLoaded, setCameraLoaded] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const detectedPeopleRef = useRef<DetectedPerson[]>([]);
  const frameStore = useRef<SessionStorePose | null>(null);
  const lastRunRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
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
      return;
    }

    detectedPeopleRef.current = [];
    lastRunRef.current = 0;

    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);
    img.src = objectUrl;

    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    if (imageFile || !isCameraActive) {
      // eslint-disable-next-line
      setCameraLoaded(false);
      return;
    }

    let currentStream: MediaStream | null = null;
    async function startCam() {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia(
          getVideoConstraints(),
        );
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraLoaded(true);
          };
        }
      } catch (err) {
        console.error(err);
      }
    }

    startCam();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, imageFile]);

  // Render loop for Canvas
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
          if (
            detectionSettings.runDetection &&
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
            timestamp - lastRunRef.current >= inferenceIntervalMs
          ) {
            lastRunRef.current = timestamp;
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
                      } else
                        frameStore.current?.sendData(frame, timestamp, people);
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

  const showCanvas = imageFile !== null || isCameraActive;

  return showCanvas ? (
    <>
      <video ref={videoRef} playsInline muted className="hidden"></video>
      <canvas
        ref={canvasRef}
        width={getCanvasConstraints().width}
        height={getCanvasConstraints().height}
        className="w-full h-full rounded-2xl"
      ></canvas>
    </>
  ) : (
    <div className="w-full h-full text-center items-center justify-center flex gap-x-2">
      Camera Disabled
      <CircleX />
    </div>
  );
}
