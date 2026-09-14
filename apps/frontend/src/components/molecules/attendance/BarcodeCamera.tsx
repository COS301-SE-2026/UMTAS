"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface BarcodeCameraProps {
  onScan: (value: string) => void;
}

type CameraCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: {
    min: number;
    max: number;
    step?: number;
  };
  torch?: boolean;
};

type CameraSettings = MediaTrackSettings & {
  focusMode?: string;
  zoom?: number;
};

export function BarcodeCamera({ onScan }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState("Starting camera...");
  const [debug, setDebug] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let controls: { stop: () => void } | undefined;
    let cancelled = false;

    async function start() {
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

        console.log("Camera capabilities:", capabilities);
        console.log("Camera settings:", track.getSettings());

        setDebug(
          JSON.stringify(
            {
              capabilities,
              settings: track.getSettings(),
            },
            null,
            2,
          ),
        );

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setStatus("Camera ready");

        const hints = new Map();

        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);

        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);

        controls = await reader.decodeFromStream(
          stream,
          videoRef.current,
          (result) => {
            if (!result) {
              return;
            }

            console.log(
              "Barcode:",
              result.getText(),
              result.getBarcodeFormat(),
            );

            setStatus(`Scanned: ${result.getText()}`);

            onScan(result.getText());
          },
        );
      } catch (error) {
        console.error(error);

        if (error instanceof DOMException) {
          setStatus(`${error.name}: ${error.message}`);
          return;
        }

        setStatus("Unable to start camera");
      }
    }

    start();

    return () => {
      cancelled = true;

      controls?.stop();

      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [onScan]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl">
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-[3/4] w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-[90%] rounded-md border-2 border-white" />
        </div>
      </div>

      <p className="text-sm">{status}</p>

      <details>
        <summary className="cursor-pointer text-sm">Camera diagnostics</summary>

        <pre className="mt-2 overflow-auto text-xs">{debug}</pre>
      </details>
    </div>
  );
}
