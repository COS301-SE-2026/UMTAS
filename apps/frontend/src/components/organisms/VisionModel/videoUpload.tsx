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
import {
  getSingleSessionQuery,
  patchSessionMut,
} from "../../../../utilities/VisionModel/backend/persistance";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { VisionModelSize } from "../../../../utilities/VisionModel/messageTypes";

export default function VideoUploadComp({
  modelSize,
}: {
  modelSize: VisionModelSize;
}) {
  const [video, setVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [sessionID, setSessionID] = useState<string | null>(null);

  const isProcessingRef = useRef<boolean>(false);
  const activeToastIdRef = useRef<string | number | null>(null);
  const uploadVideoRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameStore = useRef<SessionStorePose>(null);

  const [frameInterval, setFrameInterval] = useState<number>(0.5);
  const frameIntervalRef = useRef<number>(0.5);

  const [eta, setEta] = useState<string>("Calculating...");
  const [currentTimeDisplay, setCurrentTimeDisplay] =
    useState<string>("0:00 / 0:00");

  const { data: singleSession } = useQuery(
    getSingleSessionQuery({ sessionId: sessionID ?? "" }),
  );
  const { mutateAsync: updateSession, isPending: pendingPatch } =
    useMutation(patchSessionMut());

  const startTimeRef = useRef<number>(0);
  const saveErrorShownRef = useRef(false);
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
      if (activeToastIdRef.current !== null) {
        toast.dismiss(activeToastIdRef.current);
      }
      pose_Manager.terminate();
      pose_data_manager.terminate();
    };
  }, []);

  async function processVideo(file: File) {
    setIsProcessing(true);
    setProgress(0);
    setEta("Calculating...");
    setCurrentTimeDisplay("0:00 / 0:00");
    startTimeRef.current = performance.now();

    const toastId = toast.loading("Analysing video", {
      description: `${file.name} is being processed.`,
    });
    activeToastIdRef.current = toastId;

    const videoUrl = URL.createObjectURL(file);
    const videoElement = document.createElement("video");
    let completed = false;

    try {
      videoElement.src = videoUrl;
      videoElement.playsInline = true;
      videoElement.preload = "metadata";

      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => resolve();
        videoElement.onerror = () =>
          reject(new Error("The selected video could not be loaded."));
      });

      if (
        !Number.isFinite(videoElement.duration) ||
        videoElement.duration <= 0
      ) {
        throw new Error("The selected video has an invalid duration.");
      }

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
        throw new Error("The video analysis canvas is not available.");
      }

      const duration = videoElement.duration;
      let currentTime = 0;
      let numFrames = 0;

      while (currentTime < duration && isProcessingRef.current) {
        const timestamp = currentTime * 1000;
        videoElement.currentTime = currentTime;

        await new Promise<void>((resolve, reject) => {
          videoElement.onseeked = () => resolve();
          videoElement.onerror = () =>
            reject(new Error("The video could not be read during processing."));
        });

        if (!isProcessingRef.current) break;

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
          modelSize,
        );

        if (!isProcessingRef.current) break;

        if (results) {
          const people = await pose_data_manager.run(results);

          if (!isProcessingRef.current) break;

          if (people) {
            const frame = ++numFrames;

            if (frameStore.current.getNumFrames() === 0) {
              await frameStore.current.sendFirst(frame, timestamp, people);
            } else {
              await frameStore.current.sendData(frame, timestamp, people);
            }
          }
        }

        const styles = getComputedStyle(document.documentElement);
        const primaryColour =
          styles.getPropertyValue("--text-primary").trim() || "#171717";
        const secondaryColour =
          styles.getPropertyValue("--text-secondary").trim() || "#525252";

        for (const frameOfPeople of frameStore.current.getLastFrame()?.people ??
          []) {
          const data = frameOfPeople.pose_data;
          const gaze = frameOfPeople.gaze;

          if (numFrames - frameOfPeople.last_seen_frame > 3) continue;

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
        if (currentTime > duration) currentTime = duration;

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

      completed = isProcessingRef.current;

      if (completed && frameStore.current) {
        const results = await frameStore.current.analyseAllFrames();

        if (singleSession && !pendingPatch) {
          const apiRes = await updateSession({
            body: { Data: results },
            path: { sessionId: singleSession.session.SessionID },
          });
          SetSessionRes(apiRes.session.Data);
        } else {
          SetSessionRes(results);
        }

        setProgress(100);
        setEta("0:00");

        toast.success("Video analysis complete", {
          id: toastId,
          description: singleSession
            ? "The final results were saved to the session."
            : "The analysis finished successfully.",
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error("Error processing video", error);

      if (!isProcessingRef.current) {
        toast.dismiss(toastId);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "The video could not be processed.";

      toast.error("Video analysis failed", {
        id: toastId,
        description: message,
      });
    } finally {
      URL.revokeObjectURL(videoUrl);
      activeToastIdRef.current = null;
      isProcessingRef.current = false;
      setIsProcessing(false);
      pose_Manager.terminate();
      pose_data_manager.terminate();
    }
  }

  function handleVideoButton() {
    if (video === null) {
      uploadVideoRef.current?.click();
      return;
    }

    const wasProcessing = isProcessingRef.current;

    setVideo(null);
    isProcessingRef.current = false;
    setIsProcessing(false);

    if (activeToastIdRef.current !== null) {
      toast.dismiss(activeToastIdRef.current);
      activeToastIdRef.current = null;
    }

    setVideo(null);
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

    if (uploadVideoRef.current) {
      uploadVideoRef.current.value = "";
    }

    pose_Manager.terminate();
    pose_data_manager.terminate();

    toast.info(wasProcessing ? "Video analysis cancelled" : "Video removed");
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isProcessing) {
      interval = setInterval(async () => {
        if (!frameStore.current || !singleSession || pendingPatch) return;

        try {
          const result = await frameStore.current.analyseAllFrames();
          const apiRes = await updateSession({
            body: { Data: result },
            path: { sessionId: singleSession.session.SessionID },
          });

          SetSessionRes(apiRes.session.Data);
          saveErrorShownRef.current = false;
        } catch (error) {
          console.error("Could not save video analysis progress:", error);

          if (!saveErrorShownRef.current) {
            saveErrorShownRef.current = true;
            toast.error("Progress could not be saved", {
              description:
                "Video analysis is still running. UMTAS will try to save again automatically.",
            });
          }
        }
      }, 3 * 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, singleSession, updateSession, pendingPatch]);

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
              Analyse Video
              {singleSession?.session.SessionName && (
                <> · {singleSession.session.SessionName}</>
              )}
            </CardTitle>

            <CardDescription className="text-sm text-[var(--text-secondary)]">
              Select a lecture video and let Lecture Watch analyse attention,
              movement and participation.
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
                    Analysis Settings
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
                      Analysis Interval
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
                      Results
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm text-[var(--text-secondary)]">
                    <span>Questions asked:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {sessionRes.questions_asked}
                    </span>

                    <span>Paying attention:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {sessionRes.total_frames > 0
                        ? `${((sessionRes.total_paying_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                        : "0.00%"}
                    </span>

                    <span>Not Paying attention:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {sessionRes.total_frames > 0
                        ? `${((sessionRes.total_no_attention / sessionRes.total_frames) * 100).toFixed(2)}%`
                        : "0.00%"}
                    </span>
                    <span>Sitting still:</span>
                    <span className="font-medium text-[var(--text-primary)] text-right">
                      {`${percentageStable.toFixed(2)}%`}
                    </span>

                    <span>Restless:</span>
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

                      if (!file) return;

                      if (file.type !== "video/mp4") {
                        toast.error("Unsupported video", {
                          description: "Please choose an MP4 video file.",
                        });
                        event.target.value = "";
                        return;
                      }

                      setVideo(file);
                      isProcessingRef.current = true;
                      void processVideo(file);
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleVideoButton}
                  >
                    {isProcessing
                      ? "Cancel Analysis"
                      : video
                        ? "Remove Video"
                        : "Select Video"}
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
