"use client";
import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";
import { detectionManager } from "../../../../utilities/VisionModel/detectionManager";
import { detection_data_manager } from "../../../../utilities/VisionModel/detection_data_manager";
import { DetectedPerson } from "../../../../utilities/VisionModel/messageTypes";

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
}: CanvasCamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [cameraLoaded, setCameraLoaded] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const detectedPeopleRef = useRef<DetectedPerson[]>([]);
  const lastRunRef = useRef<number>(0);

  // Manage detection workers
  useEffect(() => {
    const isSourceActive = isCameraActive || imageFile !== null;
    if (detectionSettings.runDetection && isSourceActive) {
      detectionManager.start();
      detection_data_manager.start();
    } else {
      detectionManager.terminate();
      detection_data_manager.terminate();
    }
  }, [detectionSettings.runDetection, isCameraActive, imageFile]);

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

          const intervalMs = detectionSettings.DetectionInterval * 1000;
          if (
            detectionSettings.runDetection &&
            timestamp - lastRunRef.current >= intervalMs
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

          if (detectionSettings.runDetection) {
            for (const person of detectedPeopleRef.current) {
              context.strokeStyle = "#00ff00";
              context.lineWidth = 2;
              context.strokeRect(
                person.top_left_x,
                person.top_left_y,
                person.width,
                person.height,
              );

              context.fillStyle = "#00ff00";
              context.font = "14px sans-serif";
              context.fillText(
                `Person ${(person.confidence * 100).toFixed(0)}%`,
                person.top_left_x,
                Math.max(person.top_left_y - 5, 15),
              );
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
  }, [cameraLoaded, imageLoaded, imageFile, detectionSettings]);

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
