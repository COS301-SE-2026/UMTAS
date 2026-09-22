import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import { useRef, useState } from "react";
import { pose_Manager } from "../../../../utilities/VisionModel/pose_manager";
import { pose_data_manager } from "../../../../utilities/VisionModel/pose_data_manager";
import SessionStorePose, {
  frameStore,
} from "../../../../utilities/VisionModel/sessionStore/poseSessionStore";
import { drawPoint, drawSegment } from "./CameraCanvas";

export default function VideoUploadComp() {
  const [video, SetVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>();
  const isProcessingRef = useRef<boolean>(false);
  const uploadVideoRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameStore = useRef<SessionStorePose>(null);

  async function processVideo(file: File) {
    setIsProcessing(true);
    setProgress(0);

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
      frameStore.current.clear();
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!canvas || !context) {
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
      return;
    }

    const duration = video.duration;
    const STEP_SECONDS = 0.5;
    let currentTime = 0;
    let numFrames = 0;

    try {
      while (currentTime < duration && isProcessingRef.current) {
        const timestamp = currentTime * 1000;
        video.currentTime = currentTime;
        await new Promise((res) => {
          video.onseeked = res;
        });

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
        if (results) {
          const people = await pose_data_manager.run(results);
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

        currentTime += STEP_SECONDS;
        if (currentTime > duration) {
          currentTime = duration;
        }
        const progressVal = (currentTime / duration) * 100;
        setProgress(progressVal);
      }
    } catch (err) {
      console.error("Error Processing video", err);
    } finally {
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
    }
  }

  return (
    <div className="h-3/4 w-1/2  items-center flex flex-col   px-2 ">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Upload Video
        </h1>
        <div className="h-full w-full p-2">
          <div className="w-full h-1/10 p-2 gap-y-1 flex flex-col ">
            <h1>Progress {video && `${progress.toFixed(2)}`} </h1>
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
              <div className="h-1/4 justify-around flex items-end  w-full ">
                <Input
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
                <Button
                  disabled={video == null}
                  type="button"
                  variant="outline"
                  onClick={() => {}}
                  size="default"
                  className="h-8 w-40  cursor-pointer"
                >
                  Pause Upload
                </Button>
              </div>
            </div>
            <div className="w-full h-full  p-2">
              <div className="border w-full h-full rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
