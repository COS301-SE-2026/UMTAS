import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import { useEffect, useRef, useState } from "react";
import { pose_Manager } from "../../../../utilities/VisionModel/pose_manager";
import { pose_data_manager } from "../../../../utilities/VisionModel/pose_data_manager";
import SessionStorePose, {
  frameStore,
} from "../../../../utilities/VisionModel/sessionStore/poseSessionStore";
import { drawPoint, drawSegment } from "./CameraCanvas";
import { Label } from "@/components/atoms/baseShadcn/label";
import { SessionInferenceResult } from "../../../../utilities/VisionModel/messageTypes";

export default function VideoUploadComp() {
  const [video, SetVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>();
  const isProcessingRef = useRef<boolean>(false);
  const uploadVideoRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameStore = useRef<SessionStorePose>(null);
  const [frameInterval, setFrameInterval] = useState<number>(0.5);
  const frameIntervalRef = useRef<number>(0.5);

  const [eta, setEta] = useState<string>("Calculating...");
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>("0:00");
  const startTimeRef = useRef<number>(0);
  const [sessionRes, SetSessionRes] = useState<SessionInferenceResult>({
    detected_restless: 0,
    questions_asked: 0,
    restless_ids: [],
  });
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
    };
  }, []);

  async function processVideo(file: File) {
    setIsProcessing(true);
    setProgress(0);
    startTimeRef.current = performance.now();

    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = videoUrl;
    video.playsInline = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(true);
    });

    pose_Manager.start();
    pose_data_manager.start();
    if (frameStore.current == null) {
      frameStore.current = new SessionStorePose();
      await frameStore.current.ready();
    }
    frameStore.current.clear();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!canvas || !context) {
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
      return;
    }

    const duration = video.duration;

    let currentTime = 0;
    let numFrames = 0;

    try {
      while (currentTime < duration && isProcessingRef.current) {
        const timestamp = currentTime * 1000;
        video.currentTime = currentTime;
        await new Promise((res) => {
          video.onseeked = res;
        });
        if (!isProcessingRef.current) break;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const results = await pose_Manager.run(
          imageData?.data,
          canvas.width,
          canvas.height,
        );
        if (!isProcessingRef.current) break;

        if (results) {
          const people = await pose_data_manager.run(results);
          if (!isProcessingRef.current) break;

          if (people) {
            const frame = ++numFrames;
            if (frameStore.current?.getNumFrames() === 0) {
              frameStore.current.sendFirst(frame, timestamp, people);
            } else {
              frameStore.current?.sendData(frame, timestamp, people);
            }
          }
        }

        for (const frameOfPeople of frameStore.current?.getLastFrame()
          ?.people ?? []) {
          const data = frameOfPeople.pose_data;

          if (numFrames - frameOfPeople.last_seen_frame > 3) {
            continue;
          }

          context.fillStyle = "#00ff00";
          context.font = "14px sans-serif";
          context.fillText(
            `ID ${frameOfPeople.assigned_id.toString()}`,
            data.person.top_left_x,
            Math.max(data.person.top_left_y - 5, 15),
          );

          context.strokeStyle = "#00ffff";
          context.fillStyle = "#00ffff";
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
        }

        currentTime += frameIntervalRef.current;
        if (currentTime > duration) {
          currentTime = duration;
        }
        const progressVal = (currentTime / duration) * 100;
        setProgress(progressVal);

        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const rate = currentTime / elapsed;
        const remainingSeconds = rate > 0 ? (duration - currentTime) / rate : 0;
        const mins = Math.floor(remainingSeconds / 60);
        const secs = Math.floor(remainingSeconds % 60);
        setEta(`${mins}:${secs.toString().padStart(2, "0")}`);

        const curMins = Math.floor(currentTime / 60);
        const curSecs = Math.floor(currentTime % 60);
        const durMins = Math.floor(duration / 60);
        const durSecs = Math.floor(duration % 60);
        setCurrentTimeDisplay(
          `${curMins}:${curSecs.toString().padStart(2, "0")} / ${durMins}:${durSecs.toString().padStart(2, "0")}`,
        );
      }
    } catch (err) {
      console.error("Error Processing video", err);
    } finally {
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
    }

    const results = await frameStore.current.analyseAllFrames();
    console.log(results);
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
      }, 5 * 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  return (
    <div className="h-3/4 w-1/2  items-center flex flex-col   px-2 ">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Upload Video
        </h1>
        <div className="h-full w-full p-2">
          <div className="w-full h-1/10 p-2 gap-y-1 flex flex-col ">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <h1>
                Progress {video && `${progress.toFixed(2)}%`} (
                {currentTimeDisplay})
              </h1>
              <h1>ETA: {video ? eta : "--:--"}</h1>
            </div>
            <Progress className="border h-5 " value={progress}></Progress>
          </div>
          <div className="h-9/10 p-2 w-full grid grid-cols-2 ">
            <div className="w-full h-full p-2  ">
              <canvas
                ref={canvasRef}
                width={640}
                height={640}
                className="object-scale-down w-full h-3/4 rounded-2xl border "
              ></canvas>
              <div className="h-1/4 justify-around grid grid-cols-2 items-end  w-full ">
                <Input
                  hidden
                  ref={uploadVideoRef}
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      SetVideo(file);
                      isProcessingRef.current = true;
                      processVideo(file);
                    }
                  }}
                  className="hidden "
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (video == null) {
                      uploadVideoRef.current?.click();
                    } else {
                      SetVideo(null);
                      isProcessingRef.current = false;

                      setIsProcessing(false);
                    }
                  }}
                  size="default"
                  className="h-8 w-40  cursor-pointer"
                >
                  {video == null ? <>Upload Video</> : <>Cancel Upload</>}
                </Button>
                <Label className=" flex flex-col  w-full  text-md font-medium text-[var(--text-primary)] text-left pl-1">
                  <span className="relative group  inline-block w-fit">
                    Detection Interval
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-md shadow-md text-center z-50">
                      Please note increasing the time decreases accuracy
                    </span>
                  </span>
                  <Input
                    value={frameInterval}
                    onChange={(e) => {
                      if (Number(e.target.value) >= 0.1) {
                        const val = Number(e.target.value);
                        setFrameInterval(val);
                        frameIntervalRef.current = val;
                      }
                    }}
                    min={0.1}
                    max={100}
                    step={0.1}
                    type="number"
                    placeholder="0.5"
                    className="h-8 w-40 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (isProcessing) {
                      const result =
                        await frameStore.current?.analyseAllFrames();
                      if (result) SetSessionRes(result);
                    }
                  }}
                  size="default"
                  className="h-8 w-40  cursor-pointer"
                >
                  Run Session Inference
                </Button>
              </div>
            </div>
            <div className="w-full h-full  p-2">
              <div className="border w-full h-full rounded-2xl">
                <Label className=" flex flex-col  w-full  text-md font-medium text-[var(--text-primary)] text-left pl-1">
                  Session Analysis
                  <p> {`Questions Asked : ${sessionRes.questions_asked}`}</p>
                  <p>{`Restless detected : ${sessionRes.detected_restless}`}</p>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
