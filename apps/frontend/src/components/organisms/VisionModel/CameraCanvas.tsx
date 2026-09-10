"use client";
import { Button } from "@/components/atoms/baseShadcn/button";
import { useRef, useState } from "react";
import { CircleX } from "lucide-react";
import Webcam from "react-webcam";
import { add } from "../../../../wasm-engine/pkg/wasm_engine";

export default function CameraCanvas() {
  const webcamRef = useRef<Webcam>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [CameraLoading, setCameraLoading] = useState(false);
  function getPixelData() {
    const videoNode = webcamRef.current?.video;
    if (!videoNode || videoNode.readyState < videoNode.HAVE_CURRENT_DATA) {
      console.log("Video stream not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoNode.width || 640;
    canvas.height = videoNode.height || 480;

    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) {
      return;
    }

    canvasContext.drawImage(videoNode, 0, 0, canvas.width, canvas.height);

    //  [R, G, B, A, R, G, B, A...])
    const imageData = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    console.log("Image Data Object:", imageData);
    console.log("Total Pixels:", imageData.width * imageData.height);
    console.log(
      "First Pixel (RGBA):",
      imageData.data[0],
      imageData.data[1],
      imageData.data[2],
      imageData.data[3],
    );
  }

  return (
    <div className="w-full h-full justify-around flex flex-col gap-y-4 p-4">
      <div className="w-full h-full flex flex-col justify-center items-center text-center border rounded-xl ">
        {cameraOn ? (
          <div className="">
            <Webcam
              audio={false}
              ref={webcamRef}
              onUserMedia={() => {
                setCameraLoading(false);
              }}
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
              className="w-full h-full"
            />
          </div>
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
        <Button onClick={getPixelData}>Log screen data</Button>
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
