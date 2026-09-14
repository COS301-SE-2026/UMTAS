"use client";

import { Label } from "@/components/atoms/baseShadcn/label";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import CameraCanvas from "@/components/organisms/VisionModel/CameraCanvas";
import { useState } from "react";

export default function VM_SessionTemplate() {
  // settings
  const [cameraOn, setCameraOn] = useState(false);
  // settings

  return (
    <div className="h-[85vh]  items-center flex flex-col gap-6 w-full px-6 overflow-scroll">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Session Camera
        </h1>
        <div className="flex flex-col justify-around w-full h-full just">
          <div className="flex justify-center items-center w-full min-h-[50vh] max-h-[50vh]  md:min-h-[60vh] md:max-h-[60vh]  ">
            <CameraCanvas isCameraActive={cameraOn} />
          </div>
          <div className="  items-center flex flex-col  w-full  h-[10vh] min-h-[15vh] max-h-[15vh]">
            {/* ------------ Settings hier asseblief --------------- */}
            <div className="w-full h-full overflow-auto  rounded-t-none  border-t  border-[var(--border)]  bg-[var(--bg-surface)] shadow-sm flex flex-col">
              <div className="grid grid-cols-1 divide-y gap-5    md:grid-cols-3 min-h-[10vh] justify-center w-full h-full text-center p-2">
                <div className="h-full flex flex-col gap-y-5 p-2">
                  <h1 className="text-md font-semibold  text-[var(--text-primary)] pl-4 py-4 ">
                    Camera Settings
                  </h1>
                  <Label className=" flex flex-row w-full justify-center text-md font-medium text-[var(--text-primary)] text-left pl-1">
                    Camera On
                    <Switch
                      checked={cameraOn}
                      onCheckedChange={(e) => {
                        setCameraOn(e);
                      }}
                    />
                  </Label>
                </div>
              </div>
            </div>
            {/* ------------ Settings hier asseblief --------------- */}
          </div>
        </div>
      </div>
    </div>
  );
}
