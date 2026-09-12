"use client";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";
import Webcam from "react-webcam";
import { boolean } from "better-auth";

export default function CameraCanvas() {
  const webcamRef = useRef<Webcam>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [CameraLoading, setCameraLoading] = useState(false);

  return (
    <div className="w-full h-full justify-around flex flex-col gap-y-4 p-4">
      <div className="w-full h-full flex flex-col justify-center items-center text-center border rounded-xl ">
        {cameraOn ? (
          <div className="">{/* canvas go here */}</div>
        ) : (
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
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
  }, []);

  return (
    <>
      <video ref={videoRef} playsInline muted></video>
      <canvas ref={canvasRef} width={640} height={640}></canvas>
    </>
  );
}
