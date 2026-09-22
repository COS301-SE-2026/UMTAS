"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import Popup from "@/components/atoms/utility/floatContainer";
import CameraCanvas, {
  DetectionSettings,
  InferenceSettings,
} from "@/components/organisms/VisionModel/CameraCanvas";
import VideoUploadComp from "@/components/organisms/VisionModel/videoUpload";
import { useRef, useState } from "react";

export default function VM_SessionTemplate() {
  // settings
  const [cameraOn, setCameraOn] = useState(false);
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(
    {
      runDetection: false,
      DetectionInterval: 0,
    },
  );
  const [inferenceSettings, setInferenceSettings] = useState<InferenceSettings>(
    {
      runInference: false,
      InferenceInterval: 0,
    },
  );
  const [imageUpload, setImageUpload] = useState<File | null>(null);

  const [showVideoPopUp, SetShowVideoPopUp] = useState<boolean>(false);

  const uploadImageRef = useRef<HTMLInputElement>(null);
  // settings

  return (
    <>
      <div className="h-[85vh]  items-center flex flex-col  w-full px-2 ">
        <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl shadow-sm flex flex-col">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
            Session Camera
          </h1>
          <div className="flex flex-col overflow-scroll  border justify-around w-full h-full ">
            <div className="flex  justify-center   items-center rounded-2xl rounded-t-none">
              <div className="w-full h-full md:aspect-video">
                <CameraCanvas
                  isCameraActive={cameraOn}
                  detectionSettings={detectionSettings}
                  inferenceSettings={inferenceSettings}
                  imageFile={imageUpload}
                />
              </div>
            </div>
            <div className=" pb-4  flex flex-col md:flex-row   w-full h-full rounded-2xl rounded-t-none">
              {/* ------------ Settings hier asseblief --------------- */}
              <div className="w-full h-full flex flex-col  gap-y-4  ">
                <h1 className="text-md font-semibold text-center text-[var(--text-primary)] pl-4 py-4 ">
                  Upload
                </h1>
                <Label className=" flex flex-col  w-full  text-md font-medium text-[var(--text-primary)] text-left pl-1 gap-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      SetShowVideoPopUp(true);
                    }}
                    size="default"
                    className="h-8 w-40  cursor-pointer"
                  >
                    Upload Video
                  </Button>
                  <Button
                    type="button"
                    variant={"outline"}
                    onClick={() => {
                      if (imageUpload == null) uploadImageRef.current?.click();
                      else setImageUpload(null);
                    }}
                    size="default"
                    className="h-8 w-40  cursor-pointer"
                  >
                    {imageUpload == null ? (
                      <>Upload Image</>
                    ) : (
                      <>Remove Image</>
                    )}
                  </Button>

                  <Input
                    ref={uploadImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageUpload(file);
                        setCameraOn(false);
                      }
                    }}
                    className="hidden "
                  />
                </Label>
              </div>
              <div className="w-full h-full flex flex-col  gap-y-4  ">
                <h1 className="text-md font-semibold text-center text-[var(--text-primary)] pl-4 py-4 ">
                  Camera Settings:
                </h1>
                <Label className=" flex flex-col  text-center    w-full text-md font-medium text-[var(--text-primary)]  pl-1">
                  Camera On
                  <Switch
                    checked={cameraOn}
                    onCheckedChange={(e) => {
                      setCameraOn(e);
                      setImageUpload(null);
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
                      setInferenceSettings((settings) => ({
                        ...settings,
                        runInference: false,
                      }));
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
                    value={detectionSettings.DetectionInterval}
                    onChange={(e) => {
                      setDetectionSettings((settings) => ({
                        ...settings,
                        DetectionInterval: Number(e.target.value),
                      }));
                    }}
                    min={0}
                    max={100}
                    step={0.2}
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
                    checked={inferenceSettings.runInference}
                    onCheckedChange={(e) => {
                      setInferenceSettings((settings) => ({
                        ...settings,
                        runInference: e,
                      }));
                      setDetectionSettings((settings) => ({
                        ...settings,
                        runDetection: false,
                      }));
                    }}
                  />
                </Label>
                <Label className=" flex flex-col  w-full  text-md font-medium text-[var(--text-primary)] text-left pl-1">
                  Inference Interval
                  <Input
                    value={inferenceSettings.InferenceInterval}
                    onChange={(e) => {
                      setInferenceSettings((settings) => ({
                        ...settings,
                        InferenceInterval: Number(e.target.value),
                      }));
                    }}
                    min={0}
                    max={100}
                    step={0.2}
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

      {showVideoPopUp && (
        <Popup onClose={() => SetShowVideoPopUp(false)}>
          <VideoUploadComp />
        </Popup>
      )}
    </>
  );
}
