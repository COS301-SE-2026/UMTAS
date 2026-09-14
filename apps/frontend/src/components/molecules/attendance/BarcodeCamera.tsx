"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

import { Button } from "@/components/atoms/baseShadcn/button";

interface BarcodeCameraProps {
  onScan: (value: string) => void;
}

type CameraCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  focusDistance?: {
    min?: number;
    max?: number;
    step?: number;
  };
  zoom?: {
    min: number;
    max: number;
    step?: number;
  };
  torch?: boolean;
  pointsOfInterest?: boolean;
};

type CameraSettings = MediaTrackSettings & {
  focusMode?: string;
  focusDistance?: number;
  zoom?: number;
  torch?: boolean;
};

interface ScanEvent {
  value: string;
  timestamp: Date;
}

async function tryEnableContinuousFocus(
  track: MediaStreamTrack,
  capabilities: CameraCapabilities,
) {
  if (!capabilities.focusMode?.includes("continuous")) {
    console.log("Continuous focus not exposed by this browser/device");

    return;
  }

  try {
    await track.applyConstraints({
      advanced: [
        {
          focusMode: "continuous",
        } as MediaTrackConstraintSet,
      ],
    });

    console.log("Continuous autofocus enabled");
  } catch (error) {
    console.warn("Unable to enable continuous autofocus:", error);
  }
}

export function BarcodeCamera({ onScan }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const [status, setStatus] = useState("Starting camera...");

  const [debug, setDebug] = useState("");

  const [scanCount, setScanCount] = useState(0);

  const [lastScan, setLastScan] = useState<string | null>(null);

  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const [scanHistory, setScanHistory] = useState<ScanEvent[]>([]);

  const [scanFlash, setScanFlash] = useState(false);

  const [zoom, setZoomState] = useState(1);

  const [torchEnabled, setTorchEnabled] = useState(false);

  const [torchSupported, setTorchSupported] = useState(false);

  const [focusSupported, setFocusSupported] = useState(false);

  const [tapFocusSupported, setTapFocusSupported] = useState(false);

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

        trackRef.current = track;

        const capabilities = track.getCapabilities() as CameraCapabilities;

        setTorchSupported(capabilities.torch === true);

        setFocusSupported(
          capabilities.focusMode?.includes("continuous") ?? false,
        );

        setTapFocusSupported(capabilities.pointsOfInterest === true);

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

        await tryEnableContinuousFocus(track, capabilities);

        if (capabilities.zoom) {
          try {
            const initialZoom = Math.min(2, capabilities.zoom.max);

            await track.applyConstraints({
              advanced: [
                {
                  zoom: initialZoom,
                } as MediaTrackConstraintSet,
              ],
            });

            setZoomState(initialZoom);
          } catch (error) {
            console.warn("Unable to apply initial zoom:", error);
          }
        }

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setStatus("Camera ready — waiting for barcode");

        const hints = new Map();

        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);

        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 500,
        });

        controls = await reader.decodeFromStream(
          stream,
          videoRef.current,
          (result) => {
            if (!result) {
              return;
            }

            const value = result.getText();

            const timestamp = new Date();

            console.log("Barcode detected:", value, result.getBarcodeFormat());

            setScanCount((count) => count + 1);

            setLastScan(value);

            setLastScanTime(timestamp);

            setScanHistory((history) =>
              [
                {
                  value,
                  timestamp,
                },
                ...history,
              ].slice(0, 10),
            );

            setScanFlash(true);

            window.setTimeout(() => {
              setScanFlash(false);
            }, 250);

            setStatus(`Scanned: ${value}`);

            onScan(value);
          },
        );
      } catch (error) {
        console.error("Camera error:", error);

        if (error instanceof DOMException) {
          if (error.name === "NotFoundError") {
            setStatus("No camera found");

            return;
          }

          if (error.name === "NotAllowedError") {
            setStatus("Camera permission denied");

            return;
          }

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

      trackRef.current = null;
    };
  }, [onScan]);

  async function setZoom(value: number) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const capabilities = track.getCapabilities() as CameraCapabilities;

    if (!capabilities.zoom) {
      return;
    }

    const safeValue = Math.min(
      Math.max(value, capabilities.zoom.min),
      capabilities.zoom.max,
    );

    try {
      await track.applyConstraints({
        advanced: [
          {
            zoom: safeValue,
          } as MediaTrackConstraintSet,
        ],
      });

      setZoomState(safeValue);

      refreshDebug();
    } catch (error) {
      console.error("Unable to change zoom:", error);
    }
  }

  async function toggleTorch() {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const capabilities = track.getCapabilities() as CameraCapabilities;

    if (!capabilities.torch) {
      return;
    }

    const nextValue = !torchEnabled;

    try {
      await track.applyConstraints({
        advanced: [
          {
            torch: nextValue,
          } as MediaTrackConstraintSet,
        ],
      });

      setTorchEnabled(nextValue);

      refreshDebug();
    } catch (error) {
      console.error("Unable to toggle torch:", error);
    }
  }

  async function focusAtPoint(x: number, y: number) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    try {
      await track.applyConstraints({
        advanced: [
          {
            pointsOfInterest: [
              {
                x,
                y,
              },
            ],
          } as MediaTrackConstraintSet,
        ],
      });

      console.log("Requested focus point:", {
        x,
        y,
      });

      setStatus("Focus requested");

      refreshDebug();
    } catch (error) {
      console.warn("Tap-to-focus not supported:", error);

      setStatus("Tap-to-focus not supported");
    }
  }

  function handleVideoTap(event: MouseEvent<HTMLVideoElement>) {
    if (!tapFocusSupported) {
      setStatus("Browser does not expose tap-to-focus");

      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    const rect = video.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;

    const y = (event.clientY - rect.top) / rect.height;

    void focusAtPoint(x, y);
  }

  function refreshDebug() {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const capabilities = track.getCapabilities() as CameraCapabilities;

    const settings = track.getSettings() as CameraSettings;

    setDebug(
      JSON.stringify(
        {
          capabilities,
          settings,
        },
        null,
        2,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`relative overflow-hidden rounded-xl border-4 transition-colors duration-200 ${
          scanFlash ? "border-green-500" : "border-transparent"
        }`}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          onClick={handleVideoTap}
          className="aspect-[3/4] w-full cursor-crosshair object-cover"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`h-24 w-[90%] rounded-md border-2 transition-colors duration-200 ${
              scanFlash ? "border-green-500" : "border-white"
            }`}
          />
        </div>

        <div className="absolute left-3 top-3 rounded-md bg-black/70 px-3 py-2 text-xs text-white">
          Detected: {scanCount}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/70 px-3 py-2 text-xs text-white">
          {tapFocusSupported ? "Tap barcode to focus" : "Automatic focus"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={zoom === 1 ? "default" : "outline"}
          onClick={() => void setZoom(1)}
        >
          1×
        </Button>

        <Button
          variant={zoom === 1.5 ? "default" : "outline"}
          onClick={() => void setZoom(1.5)}
        >
          1.5×
        </Button>

        <Button
          variant={zoom === 2 ? "default" : "outline"}
          onClick={() => void setZoom(2)}
        >
          2×
        </Button>

        <Button
          variant={zoom === 2.5 ? "default" : "outline"}
          onClick={() => void setZoom(2.5)}
        >
          2.5×
        </Button>

        <Button
          variant="outline"
          disabled={!torchSupported}
          onClick={() => void toggleTorch()}
        >
          {torchEnabled ? "Torch off" : "Torch on"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>

          <p className="font-medium">{status}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Successful scans</p>

          <p className="text-2xl font-semibold">{scanCount}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Last barcode</p>

          <p className="font-mono font-medium">{lastScan ?? "None"}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Last detected</p>

          <p className="font-medium">
            {lastScanTime ? lastScanTime.toLocaleTimeString() : "Never"}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Zoom</p>

          <p className="font-medium">{zoom.toFixed(1)}×</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Focus control</p>

          <p className="font-medium">
            {focusSupported
              ? "Continuous"
              : tapFocusSupported
                ? "Tap focus"
                : "Browser automatic"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Detection history</p>

        {scanHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No barcodes detected yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {scanHistory.map((scan, index) => (
              <div
                key={`${scan.timestamp.getTime()}-${index}`}
                className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
              >
                <span className="font-mono">{scan.value}</span>

                <span className="text-xs text-muted-foreground">
                  {scan.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <details>
        <summary className="cursor-pointer text-sm">Camera diagnostics</summary>

        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
          {debug}
        </pre>
      </details>
    </div>
  );
}
