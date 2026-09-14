"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";

import { Card, CardContent } from "@/components/atoms/baseShadcn/card";

interface BarcodeCameraProps {
  onScan: (value: string) => void;
}

type CameraState =
  "loading" | "ready" | "not-found" | "permission-denied" | "error";

export function BarcodeCamera({ onScan }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>("loading");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

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

            onScan(result.getText());
          },
        );

        if (mounted) {
          setCameraState("ready");
        }
      } catch (error) {
        console.error("Camera error:", error);

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
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center p-6">
          <div className="text-center">
            <p className="font-medium">No camera found</p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect a camera or use another attendance method.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cameraState === "permission-denied") {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center p-6">
          <div className="text-center">
            <p className="font-medium">Camera access denied</p>

            <p className="mt-2 text-sm text-muted-foreground">
              Allow camera access in your browser settings and reload the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cameraState === "error") {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center p-6">
          <div className="text-center">
            <p className="font-medium">Unable to start camera</p>

            <p className="mt-2 text-sm text-muted-foreground">
              Please try again or use another attendance method.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {cameraState === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Starting camera...</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-[3/4] w-full object-cover"
      />
    </div>
  );
}
