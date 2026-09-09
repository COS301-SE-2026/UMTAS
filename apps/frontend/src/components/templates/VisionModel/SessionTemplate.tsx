import { Card } from "@/components/atoms/baseShadcn/card";
import CameraCanvas from "@/components/organisms/VisionModel/CameraCanvas";

export default function VM_SessionTemplate() {
  return (
    <div className="h-[80vh]  items-center flex flex-col gap-6 w-full px-6">
      <div className="w-full h-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Session Camera
        </h1>

        <div className="flex flex-row w-full h-full p-4 gap-4 ">
          <div className="flex flex-col gap-4 w-1/3 h-1/3">
            <h2 className="text-md font-medium text-[var(--text-primary)]">
              Controls & Data
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Some session details go here
            </p>
          </div>

          <div className="flex justify-center items-center w-2/3 h-full ">
            <CameraCanvas />
          </div>
        </div>
      </div>
    </div>
  );
}
