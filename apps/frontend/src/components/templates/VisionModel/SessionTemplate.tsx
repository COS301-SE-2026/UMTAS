import { Card } from "@/components/atoms/baseShadcn/card";
import CameraCanvas from "@/components/organisms/VisionModel/CameraCanvas";

export default function VM_SessionTemplate() {
  return (
    <div className="h-[85vh]  items-center flex flex-col gap-6 w-full px-6">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Session Camera
        </h1>
        <div className="grid gridgrid-cols-1 w-full h-full">
          <div className="flex justify-center items-center w-full  ">
            <CameraCanvas />
          </div>
          <div className="h-full  items-center flex flex-col  w-full ">
            <div className="w-full h-full overflow-auto  rounded-t-none  border-t  border-[var(--border)]  bg-[var(--bg-surface)] shadow-sm flex flex-col">
              <h1 className="text-md font-semibold text-[var(--text-primary)] pl-4 py-4">
                Session Settings
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 min-h-[10vh] justify-center w-full h-full text-center p-2">
                <div>setting</div>
                <div>setting</div>

                <div>setting</div>
                <div>setting</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
