"use client";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";

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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return {
    width: isMobile ? 720 : 1280,
    height: isMobile ? 1280 : 720,
  };
}

export default function CameraCanvas() {
  const [cameraOn, setCameraOn] = useState(false);

  return (
    <div className="w-full min-w-fit h-full justify-around flex flex-col gap-y-4 p-4">
      <div className="w-full min-w-fit h-full flex flex-col justify-center items-center text-center border rounded-2xl ">
        <div className={` w-full min-w-fit h-full `}>
          <CanvasWebcam isCameraActive={cameraOn} />
        </div>
      </div>
    </div>
  );
}

interface CanvasCamProps {
  isCameraActive: boolean;
}

function CanvasWebcam({ isCameraActive }: CanvasCamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraLoaded, setCameraLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (isCameraActive == false) {
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
  }, [isCameraActive]);

  useEffect(() => {
    if (!cameraLoaded) return;

    let animationFrameID: number;

    function renderFrame() {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video) {
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }

      animationFrameID = requestAnimationFrame(renderFrame);
    }
    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameID);
    };
  }, [cameraLoaded]);

  return isCameraActive ? (
    <>
      <video ref={videoRef} playsInline muted className="hidden"></video>
      <canvas
        ref={canvasRef}
        width={getCanvasConstraints().width}
        height={getCanvasConstraints().height}
        className="w-full h-full  rounded-2xl object-cover "
      ></canvas>
    </>
  ) : (
    <div className=" w-full h-full text-center items-center justify-center flex gap-x-2">
      Camera Disabled
      <CircleX />
    </div>
  );
}
