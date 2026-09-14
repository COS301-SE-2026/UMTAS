"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface BarcodeCameraProps {
  onScan: (value: string) => void;
}

export function BarcodeCamera({ onScan }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraState, setCameraState] = useState<
    "loading" | "ready" | "not-found" | "permission-denied" | "error"
  >("loading");

  useEffect(() => {
    const hints = new Map();

    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);

    const reader = new BrowserMultiFormatReader(hints);

    let controls: { stop: () => void } | undefined;
    let mounted = true;

    async function startCamera() {
      if (!videoRef.current) {
        return;
      }

      try {
        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
          },
          videoRef.current,
          (result) => {
            if (!result) {
              return;
            }

            const value = result.getText();

            console.log("Code 39 scanned:", value);

            onScan(value);
          },
        );

        if (mounted) {
          setCameraState("ready");
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof DOMException) {
          if (error.name === "NotFoundError") {
            setCameraState("not-found");
            return;
          }

          if (error.name === "NotAllowedError") {
            setCameraState("permission-denied");
            return;
          }
        }

        setCameraState("error");
      }
    }

    startCamera();

    return () => {
      mounted = false;
      controls?.stop();
    };
  }, [onScan]);

  if (cameraState === "not-found") {
    return <p>No camera found.</p>;
  }

  if (cameraState === "permission-denied") {
    return <p>Camera access denied.</p>;
  }

  if (cameraState === "error") {
    return <p>Unable to start camera.</p>;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="aspect-[3/4] w-full rounded-xl object-cover"
    />
  );
}
