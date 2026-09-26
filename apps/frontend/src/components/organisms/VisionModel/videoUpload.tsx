import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import { useEffect, useRef, useState } from "react";
import { pose_Manager } from "../../../../utilities/VisionModel/pose_manager";
import { pose_data_manager } from "../../../../utilities/VisionModel/pose_data_manager";
import SessionStorePose from "../../../../utilities/VisionModel/sessionStore/poseSessionStore";
import { drawPoint, drawSegment } from "./CameraCanvas";
import { SessionInferenceResult } from "../../../../utilities/VisionModel/messageTypes";
import CreateVmSession from "./createSession";

export default function VideoUploadComp() {
  const [video, setVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [sessionID, setSessionID] = useState<string | null>(null);

  const isProcessingRef = useRef<boolean>(false);
  const uploadVideoRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameStore = useRef<SessionStorePose>(null);

  const [frameInterval, setFrameInterval] = useState<number>(0.5);
  const frameIntervalRef = useRef<number>(0.5);

  const [eta, setEta] = useState<string>("Calculating...");
  const [currentTimeDisplay, setCurrentTimeDisplay] =
    useState<string>("0:00 / 0:00");

  const startTimeRef = useRef<number>(0);
  const [sessionRes, SetSessionRes] = useState<SessionInferenceResult>({
    total_restless_frames: 0,
    total_stable_frames: 0,
    questions_asked: 0,
    total_frames: 0,
    total_no_attention: 0,
    total_paying_attention: 0,
  });
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
    };
  }, []);

  async function processVideo(file: File) {
    setIsProcessing(true);
    setProgress(0);
    setEta("Calculating...");
    setCurrentTimeDisplay("0:00 / 0:00");

    startTimeRef.current = performance.now();

    const videoUrl = URL.createObjectURL(file);
    const videoElement = document.createElement("video");

    videoElement.src = videoUrl;
    videoElement.playsInline = true;

    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => resolve(true);
    });

    pose_Manager.start();
    pose_data_manager.start();

    if (frameStore.current === null) {
      frameStore.current = new SessionStorePose();
      await frameStore.current.ready();
    }

    frameStore.current.clear();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", {
      willReadFrequently: true,
    });

    if (!canvas || !context) {
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
      return;
    }

    const duration = videoElement.duration;

    let currentTime = 0;
    let numFrames = 0;

    try {
      while (currentTime < duration && isProcessingRef.current) {
        const timestamp = currentTime * 1000;

        videoElement.currentTime = currentTime;

        await new Promise((resolve) => {
          videoElement.onseeked = resolve;
        });

        if (!isProcessingRef.current) {
          break;
        }

        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const results = await pose_Manager.run(
          imageData.data,
          canvas.width,
          canvas.height,
        );

        if (!isProcessingRef.current) {
          break;
        }

        if (results) {
          const people = await pose_data_manager.run(results);

          if (!isProcessingRef.current) {
            break;
          }

          if (people) {
            const frame = ++numFrames;

            if (frameStore.current?.getNumFrames() === 0) {
              await frameStore.current.sendFirst(frame, timestamp, people);
            } else {
              await frameStore.current?.sendData(frame, timestamp, people);
            }
          }
        }

        const styles = getComputedStyle(document.documentElement);

        const primaryColour =
          styles.getPropertyValue("--text-primary").trim() || "#171717";

        const secondaryColour =
          styles.getPropertyValue("--text-secondary").trim() || "#525252";

        for (const frameOfPeople of frameStore.current?.getLastFrame()
          ?.people ?? []) {
          const data = frameOfPeople.pose_data;
          const gaze = frameOfPeople.gaze;

          if (numFrames - frameOfPeople.last_seen_frame > 3) {
            continue;
          }

          context.fillStyle = primaryColour;
          context.font = "14px 'DM Sans', sans-serif";

          context.fillText(
            `ID ${frameOfPeople.assigned_id.toString()}`,
            data.person.top_left_x,
            Math.max(data.person.top_left_y - 5, 15),
          );

          context.strokeStyle = secondaryColour;
          context.fillStyle = secondaryColour;
          context.lineWidth = 2;

          const leftElbow = data.left_arm?.[0];
          const leftWrist = data.left_arm?.[1];

          const rightElbow = data.right_arm?.[0];
          const rightWrist = data.right_arm?.[1];

          drawSegment(context, data.left_shoulder, data.center_mass);

          drawSegment(context, data.right_shoulder, data.center_mass);

          drawSegment(context, data.left_shoulder, leftElbow);

          drawSegment(context, leftElbow, leftWrist);

          drawSegment(context, data.right_shoulder, rightElbow);

          drawSegment(context, rightElbow, rightWrist);

          drawSegment(context, data.nose, data.center_mass);

          drawPoint(context, data.nose);
          drawPoint(context, data.center_mass);
          drawPoint(context, data.left_shoulder);
          drawPoint(context, leftElbow);
          drawPoint(context, leftWrist);
          drawPoint(context, data.right_shoulder);
          drawPoint(context, rightElbow);
          drawPoint(context, rightWrist);

          if (gaze) {
            const noseX = data.nose.x;
            const noseY = data.nose.y;

            if (gaze.looking_straight) {
              const xSize = 5;
              context.beginPath();
              context.strokeStyle = "#ff3333";
              context.lineWidth = 2;
              context.moveTo(noseX - xSize, noseY - xSize);
              context.lineTo(noseX + xSize, noseY + xSize);
              context.moveTo(noseX - xSize, noseY + xSize);
              context.lineTo(noseX + xSize, noseY - xSize);
              context.stroke();
            } else if (gaze.looking_left || gaze.looking_right) {
              const lineLength = 25;
              const directionMultiplier = gaze.looking_left ? -1 : 1;

              context.beginPath();
              context.strokeStyle = "#ffcc00";
              context.lineWidth = 3;
              context.moveTo(noseX, noseY);
              context.lineTo(noseX + lineLength * directionMultiplier, noseY);
              context.stroke();
            }
          }
        }

        currentTime += frameIntervalRef.current;

        if (currentTime > duration) {
          currentTime = duration;
        }

        const progressValue = (currentTime / duration) * 100;

        setProgress(progressValue);

        const elapsed = (performance.now() - startTimeRef.current) / 1000;

        const rate = currentTime / elapsed;

        const remainingSeconds = rate > 0 ? (duration - currentTime) / rate : 0;

        const remainingMinutes = Math.floor(remainingSeconds / 60);

        const remainingSecs = Math.floor(remainingSeconds % 60);

        setEta(
          `${remainingMinutes}:${remainingSecs.toString().padStart(2, "0")}`,
        );

        const currentMinutes = Math.floor(currentTime / 60);

        const currentSeconds = Math.floor(currentTime % 60);

        const durationMinutes = Math.floor(duration / 60);

        const durationSeconds = Math.floor(duration % 60);

        setCurrentTimeDisplay(
          `${currentMinutes}:${currentSeconds
            .toString()
            .padStart(2, "0")} / ${durationMinutes}:${durationSeconds
            .toString()
            .padStart(2, "0")}`,
        );
      }
    } catch (error) {
      console.error("Error processing video", error);
    } finally {
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
    }

    if (isProcessingRef.current && frameStore.current) {
      const results = await frameStore.current.analyseAllFrames();

      console.log(results);
    }
  }

  function handleVideoButton() {
    if (video === null) {
      uploadVideoRef.current?.click();
      return;
    }

    setVideo(null);
    isProcessingRef.current = false;
    setIsProcessing(false);
    setProgress(0);
    setEta("Calculating...");
    setCurrentTimeDisplay("0:00 / 0:00");

    const context = canvasRef.current?.getContext("2d");
    SetSessionRes({
      total_restless_frames: 0,
      total_stable_frames: 0,
      questions_asked: 0,
      total_frames: 0,
      total_no_attention: 0,
      total_paying_attention: 0,
    });

    if (context && canvasRef.current) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isProcessing) {
      interval = setInterval(async () => {
        if (frameStore.current) {
          const result = await frameStore.current.analyseAllFrames();
          if (result) {
            SetSessionRes(result);
          }
        }
      }, 3 * 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  const totalRestlessFramesCount =
    sessionRes.total_restless_frames + sessionRes.total_stable_frames;

  const percentageStable =
    totalRestlessFramesCount > 0
      ? (sessionRes.total_stable_frames / totalRestlessFramesCount) * 100
      : 0;

  const percentageNotStable =
    totalRestlessFramesCount > 0
      ? (sessionRes.total_restless_frames / totalRestlessFramesCount) * 100
      : 0;

  return (
    <>
      {sessionID == null ? (
        <CreateVmSession updateSessionID={(id: string) => setSessionID(id)} />
      ) : (
        <Card className="w-[min(90vw,960px)] max-h-[85vh] overflow-auto border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <CardHeader className="space-y-1 border-b border-[var(--border)]">
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Upload Video
            </CardTitle>

            <CardDescription className="text-sm text-[var(--text-secondary)]">
              Upload a lecture video to run pose estimation and session
              analysis.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <section
              aria-label="Processing progress"
              className="space-y-3 rounded-lg border border-[var(--border)] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Processing
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {video ? currentTimeDisplay : "Select a video to begin."}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {video ? `${progress.toFixed(0)}%` : "0%"}
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    ETA: {video ? eta : "--:--"}
                  </p>
                </div>
              </div>

              <Progress
                value={progress}
                className="h-2 w-full"
                aria-label={`Video processing ${progress.toFixed(0)}% complete`}
              />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
              <section
                aria-label="Video analysis preview"
                className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
              >
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={640}
                  className="aspect-square h-auto w-full object-contain"
                />
              </section>

              <section className="flex flex-col rounded-lg border border-[var(--border)] p-4">
                <div>
                  <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
                    Processing Settings
                  </h2>

                  <p className="mt-1 text-xs leading-[1.5] text-[var(--text-secondary)]">
                    Configure how frequently frames are analysed.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="frame-interval"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Detection Interval
                    </Label>

                    <Input
                      id="frame-interval"
                      value={frameInterval}
                      disabled={isProcessing}
                      onChange={(event) => {
                        const value = Number(event.target.value);

                        if (value >= 0.5) {
                          setFrameInterval(value);
                          frameIntervalRef.current = value;
                        }
                      }}
                      min={0.5}
                      max={100}
                      step={0.1}
                      type="number"
                      placeholder="0.5"
                    />

                    <p className="text-xs leading-[1.5] text-[var(--text-secondary)]">
                      Time between analysed frames in seconds. Larger intervals
                      process faster but may reduce accuracy.
                    </p>
                  </div>

                  {video && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Selected Video
                      </p>

                      <p className="break-all text-xs text-[var(--text-secondary)]">
                        {video.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-4 border-t py-4">
                  <div>
                    <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
                      Results:
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm text-[var(--text-secondary)]">
                    <span>Questions asked:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {sessionRes.questions_asked}
                    </span>

                    <span>Paying Attention:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {sessionRes.total_frames > 0
                        ? `${((sessionRes.total_paying_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                        : "0.00%"}
                    </span>

                    <span>Not Paying Attention:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {sessionRes.total_frames > 0
                        ? `${((sessionRes.total_no_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                        : "0.00%"}
                    </span>
                    <span>Sitting still:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {`${percentageStable.toFixed(2)}%`}
                    </span>

                    <span>Not Sitting still:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {`${percentageNotStable.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
                <div className="mt-auto pt-6">
                  <Input
                    ref={uploadVideoRef}
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        setVideo(file);
                        isProcessingRef.current = true;
                        void processVideo(file);
                      }
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleVideoButton}
                  >
                    {video ? "Cancel Processing" : "Select Video"}
                  </Button>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
