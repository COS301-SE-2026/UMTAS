"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { readBarcodes } from "zxing-wasm/reader";

interface BarcodeCameraProps {
  onScan: (value: string) => void;
}

type CameraCapabilities = MediaTrackCapabilities & {
  zoom?: {
    min: number;
    max: number;
    step?: number;
  };
};

type CameraState =
  "starting" | "ready" | "not-found" | "permission-denied" | "error";

type DecoderSource = "ZXING_JS" | "ZXING_WASM";

export function BarcodeCamera({ onScan }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>("starting");

  const [scanFlash, setScanFlash] = useState(false);

  const lastScanRef = useRef<{
    value: string;
    time: number;
  } | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    let jsControls: { stop: () => void } | undefined;

    let wasmInterval: ReturnType<typeof setInterval> | undefined;

    let cancelled = false;
    let wasmBusy = false;

    function handleDecodedValue(value: string, source: DecoderSource) {
      const now = Date.now();

      if (
        lastScanRef.current?.value === value &&
        now - lastScanRef.current.time < 1500
      ) {
        return;
      }

      lastScanRef.current = {
        value,
        time: now,
      };

      console.log(`Barcode decoded by ${source}:`, value);

      setScanFlash(true);

      window.setTimeout(() => {
        setScanFlash(false);
      }, 300);

      onScan(value);
    }

    async function scanWithWasm() {
      if (wasmBusy) {
        return;
      }

      const video = videoRef.current;

      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      const width = video.videoWidth;

      const height = video.videoHeight;

      if (!width || !height) {
        return;
      }

      wasmBusy = true;

      try {
        const cropHeight = Math.floor(height * 0.3);

        const cropY = Math.floor((height - cropHeight) / 2);

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = cropHeight;

        const context = canvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!context) {
          return;
        }

        context.drawImage(
          video,
          0,
          cropY,
          width,
          cropHeight,
          0,
          0,
          width,
          cropHeight,
        );

        const imageData = context.getImageData(0, 0, width, cropHeight);

        const results = await readBarcodes(imageData, {
          formats: ["Code39"],
          tryHarder: true,
        });

        const result = results[0];

        if (!result?.text) {
          return;
        }

        handleDecodedValue(result.text, "ZXING_WASM");
      } catch {
      } finally {
        wasmBusy = false;
      }
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
        });

        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());

          return;
        }

        const track = stream.getVideoTracks()[0];

        const capabilities = track.getCapabilities() as CameraCapabilities;

        if (capabilities.zoom) {
          const zoom = Math.min(2, capabilities.zoom.max);

          try {
            await track.applyConstraints({
              advanced: [
                {
                  zoom,
                } as MediaTrackConstraintSet,
              ],
            });
          } catch {}
        }

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setCameraState("ready");

        const hints = new Map();

        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);

        hints.set(DecodeHintType.TRY_HARDER, true);

        const jsReader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 1000,
        });

        jsControls = await jsReader.decodeFromStream(
          stream,
          videoRef.current,
          (result) => {
            if (!result) {
              return;
            }

            handleDecodedValue(result.getText(), "ZXING_JS");
          },
        );

        const wasmInterval = window.setInterval(() => {
          void scanWithWasm();
        }, 200);
      } catch (error) {
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

    void startCamera();

    return () => {
      cancelled = true;

      jsControls?.stop();

      if (wasmInterval) {
        clearInterval(wasmInterval);
      }

      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [onScan]);

  if (cameraState === "not-found") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border p-6">
        <div className="text-center">
          <p className="font-medium">No camera found</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Connect a camera or use another device.
          </p>
        </div>
      </div>
    );
  }

  if (cameraState === "permission-denied") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border p-6">
        <div className="text-center">
          <p className="font-medium">Camera access denied</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Allow camera access and reload the page.
          </p>
        </div>
      </div>
    );
  }

  if (cameraState === "error") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border p-6">
        <div className="text-center">
          <p className="font-medium">Unable to start camera</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative overflow-hidden rounded-xl border-4 transition-colors duration-200 ${
          scanFlash ? "border-green-500" : "border-transparent"
        }`}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-[3/4] w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`h-24 w-[90%] rounded-md border-2 transition-colors duration-200 ${
              scanFlash ? "border-green-500" : "border-white"
            }`}
          />
        </div>

        {cameraState === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
            Starting camera...
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Align the barcode inside the frame
      </p>
    </div>
  );
}
