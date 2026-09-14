"use client";

import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import CameraCanvas, {
  DetectionSettings,
} from "@/components/organisms/VisionModel/CameraCanvas";
import { useState } from "react";

export default function VM_SessionTemplate() {
  // settings
  const [cameraOn, setCameraOn] = useState(false);
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(
    {
      runDetection: false,
      DetectionInterval: 1,
    },
  );

  // settings

  return (
    <div className="h-[85vh]  items-center flex flex-col  w-full px-2 ">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Session Camera
        </h1>
        <div className="flex flex-col overflow-scroll  border justify-around w-full h-full ">
          <div className="flex  justify-center   items-center rounded-2xl rounded-t-none">
            <div className="w-full h-full md:aspect-video">
              <CameraCanvas
                isCameraActive={cameraOn}
                detectionSettings={detectionSettings}
              />
            </div>
          </div>
          <div className=" pb-4  flex flex-col md:flex-row   w-full h-full rounded-2xl rounded-t-none">
            {/* ------------ Settings hier asseblief --------------- */}

            <div className="w-full h-full flex flex-col  gap-y-4  ">
              <h1 className="text-md font-semibold text-center text-[var(--text-primary)] pl-4 py-4 ">
                Camera Settings:
              </h1>
              <Label className=" flex flex-col  text-center  items-center justify-center  w-full text-md font-medium text-[var(--text-primary)]  pl-1">
                Camera On
                <Switch
                  checked={cameraOn}
                  onCheckedChange={(e) => {
                    setCameraOn(e);
                  }}
                />
              </Label>
            </div>
            <div className="w-full h-full flex flex-col  gap-y-4  ">
              <h1 className="text-md font-semibold text-center text-[var(--text-primary)] pl-4 py-4 ">
                Detection Settings
              </h1>

              <Label className=" flex flex-col  w-full text-md font-medium text-[var(--text-primary)] text-left pl-1">
                Detection on
                <Switch
                  checked={detectionSettings.runDetection}
                  onCheckedChange={(e) => {
                    setDetectionSettings((settings) => ({
                      ...settings,
                      runDetection: e,
                    }));
                  }}
                />
              </Label>
              <Label className=" flex flex-col  w-full  text-md font-medium text-[var(--text-primary)] text-left pl-1">
                Detection Interval
                <Input
                  data-testid="course-Page-input"
                  id="course-page"
                  value={detectionSettings.DetectionInterval}
                  onChange={(e) => {
                    setDetectionSettings((settings) => ({
                      ...settings,
                      DetectionInterval: Number(e.target.value),
                    }));
                  }}
                  min={1}
                  max={100}
                  type="number"
                  placeholder="0"
                  className="h-8 w-40 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </Label>
            </div>
            <div className="w-full h-full flex flex-col  gap-y-4  ">
              <h1 className="text-md font-semibold text-center text-[var(--text-primary)] pl-4 py-4 ">
                Inference Settings
              </h1>

              <Label className=" flex flex-col  w-full text-md font-medium text-[var(--text-primary)] text-left pl-1">
                Run Inference
                <Switch
                  checked={detectionSettings.runDetection}
                  onCheckedChange={(e) => {}}
                />
              </Label>
              <Label className=" flex flex-col  w-full  text-md font-medium text-[var(--text-primary)] text-left pl-1">
                Inference Interval
                <Input
                  data-testid="course-Page-input"
                  id="course-page"
                  value={detectionSettings.DetectionInterval}
                  onChange={(e) => {}}
                  min={1}
                  max={100}
                  type="number"
                  placeholder="0"
                  className="h-8 w-40 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </Label>
            </div>
          </div>
        </div>
        {/* ------------ Settings hier asseblief --------------- */}
      </div>
    </div>
  );
}
