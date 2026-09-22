import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import { useRef, useState } from "react";
import { pose_Manager } from "../../../../utilities/VisionModel/pose_manager";
import { pose_data_manager } from "../../../../utilities/VisionModel/pose_data_manager";
import SessionStorePose, {
  frameStore,
} from "../../../../utilities/VisionModel/sessionStore/poseSessionStore";

export default function VideoUploadComp() {
  const [video, SetVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>();

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
      while (currentTime < duration) {
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

        await pose_Manager
          .run(imageData?.data, canvas.width, canvas.height)
          .then((results) => {
            if (results) {
              pose_data_manager.run(results).then((people) => {
                if (people) {
                  const frame = ++numFrames;
                  if (frameStore.current?.getNumFrames() === 0) {
                    frameStore.current.sendFirst(frame, timestamp, people);
                  } else frameStore.current?.sendData(frame, timestamp, people);
                }
              });
            }
          });

        currentTime += STEP_SECONDS;
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
            <h1>Progress </h1>
            <Progress value={progress}></Progress>
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
