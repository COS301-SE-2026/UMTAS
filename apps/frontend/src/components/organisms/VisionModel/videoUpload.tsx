import { Button } from "@/components/atoms/baseShadcn/button";

export default function VideoUploadComp() {
  return (
    <div className="h-3/4 w-1/2  items-center flex flex-col   px-2 ">
      <div className="w-full h-full max-w-7xl overflow-auto border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl shadow-sm flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Upload Video
        </h1>
        <div className="h-full w-full p-2">
          <div className="w-full h-1/10 bg-green-700 p-2 ">progress bar</div>
          <div className="h-9/10 p-2 w-full grid grid-cols-2 ">
            <div className="w-full h-full p-2  ">
              <canvas
                width={640}
                height={640}
                className="object-scale-down w-full h-3/4 rounded-2xl border "
              ></canvas>
              <div className="h-1/4 justify-around flex items-end  w-full ">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {}}
                  size="default"
                  className="h-8 w-40  cursor-pointer"
                >
                  Upload Video
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {}}
                  size="default"
                  className="h-8 w-40  cursor-pointer"
                >
                  Upload Video
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
