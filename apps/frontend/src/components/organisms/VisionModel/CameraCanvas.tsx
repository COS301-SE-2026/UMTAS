"use client";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";
import Webcam from "react-webcam";
import { boolean } from "better-auth";

export default function CameraCanvas() {
  const [cameraOn, setCameraOn] = useState(true);
  const [CameraLoading, setCameraLoading] = useState(false);

  return (
    <div className="w-full h-full justify-around flex flex-col gap-y-4 p-4">
      <div className="w-full h-full flex flex-col justify-center items-center text-center border rounded-xl ">
        <div className="">
          <CanvasWebcam isCameraActive={cameraOn} />
        </div>
        {!cameraOn && (
          <p
            className="flex gap-x-2"
            onClick={() => {
              setCameraOn(!cameraOn);
              setCameraLoading(true);
            }}
          >
            Camera Disabled
            <CircleX />
          </p>
        )}
      </div>
      <div className="flex flex-row justify-around">
        <Button
          onClick={() => {
            setCameraOn(!cameraOn);
            setCameraLoading(true);
          }}
        >
          {cameraOn ? <>Switch camera off</> : <>Switch camera on</>}
        </Button>
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
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
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
      <canvas ref={canvasRef} width={640} height={480}></canvas>
    </>
  ) : (
    <></>
  );
}
