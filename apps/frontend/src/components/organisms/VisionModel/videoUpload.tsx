import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import { useRef, useState } from "react";

export default function VideoUploadComp() {
  const [video, SetVideo] = useState<File | null>(null);
  const uploadVideoRef = useRef<HTMLInputElement>(null);
  return (
    <div className="h-3/4 w-1/2  items-center flex flex-col   px-2 ">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Upload Video
        </h1>
        <div className="h-full w-full p-2">
          <div className="w-full h-1/10 p-2 gap-y-1 flex flex-col ">
            <h1>Progress </h1>
            <Progress value={42}></Progress>
          </div>
          <div className="h-9/10 p-2 w-full grid grid-cols-2 ">
            <div className="w-full h-full p-2  ">
              <canvas
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
