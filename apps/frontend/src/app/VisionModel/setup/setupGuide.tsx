import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";

export default function VM_GUIDE() {
  return (
    <Card className="w-1/2 max-h-[85vh] overflow-auto border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="space-y-1 border-b border-[var(--border)]">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Setup Guide for Vision Model
        </CardTitle>
        <CardDescription className="text-sm text-[var(--text-secondary)]">
          This is a guide on how to get the most out of the lecture watch
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-4">
        <div>
          <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
            Lecture Watch Guide
          </h2>
          <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--text-secondary)]">
            The lecture Watch performs best under these conditions.
            <br />
            1. Stabilized camera setup in the center of a lecture hall
            <br />
            2. The camera should be placed in the general area the students are
            expected to be looking in. This is to avoid false lack of attention
            flags
            <br />
            3. The Lecture hall should be well lit to improve visibility
            <br />
            4. Remind students to fully raise their hand above their head to
            accurately capture their questions. The longer a hand is raised the
            more likely it is to be correctly captured. Hands raised for a short
            amount of time will not be counted to rule out false flags of
            questions
          </p>
          <br />
          <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
            Model Selection Guide
          </h2>
          <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--text-secondary)]">
            It is recommended that you only run the Small or Medium models if
            you have a capable system
            <br />
            1. <strong>Nano:</strong> Fastest and detects the highest number of
            students, though with lower overall accuracy.
            <br />
            2. <strong>Small:</strong> Offers a balance between speed and
            precision. It detects fewer students than Nano but significantly
            reduces false positives.
            <br />
            3. <strong>Medium:</strong> Highest accuracy and lowest
            false-positive rate, but runs the slowest and may detect fewer
            individuals overall.
          </p>
          <br />
          <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
            GPU Guide
          </h2>
          <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--text-secondary)]">
            The lecture watch feature is a computationally heavy task and a
            computers GPU is required. The GPU functionality should be enabled
            by default by any modern browser, however if you run into issues
            these can be altered in the settings of your browser. The vision
            model runs best on Chrome and on Windows and macOS. On Linux
            depending on the distribution some settings must be enabled to
            achieve functionality of the feature.
          </p>
          <br />
          <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
            Chrome features to enable if GPU permissions failed
          </h2>
          <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--text-secondary)]">
            These are possible solutions however they are not guaranteed to work
            for all cases
            <br />
            A URL is provided to find the setting to enable:
            <br />
            1. Vulkan: Enabled{" "}
            <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
              chrome://flags/#enable-vulkan
            </code>
            <br />
            2. Force enable WebGPU interop: Enabled{" "}
            <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
              chrome://flags/#force-enable-webgpu-interop
            </code>
            <br />
            3. Default ANGLE Vulkan: Enabled{" "}
            <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
              chrome://flags/#default-angle-vulkan
            </code>
            <br />
            4. Vulkan from ANGLE:{" "}
            <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
              chrome://flags/#vulkan-from-angle
            </code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
