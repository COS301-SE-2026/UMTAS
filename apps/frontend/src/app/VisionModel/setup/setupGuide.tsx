"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/baseShadcn/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/baseShadcn/accordion";

interface VMGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VM_GUIDE({ open, onOpenChange }: VMGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
        flex h-dvh max-w-none flex-col
        overflow-hidden
        rounded-none
        bg-(--bg-surface)
        sm:h-[57h] sm:max-h-[57vh] sm:max-w-2xl sm:rounded-xl
      "
      >
        <DialogHeader>
          <DialogTitle>Setup Guide for Vision Model</DialogTitle>

          <DialogDescription>
            This is a guide on how to get the most out of the lecture watch
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <Accordion type="single" collapsible className="w-full">
            <div className="space-y-2">
              <GuideSection
                number={1}
                title="Lecture Watch Guide"
                value="lecture-watch"
              >
                <p>The lecture Watch performs best under these conditions.</p>

                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>
                    Stabilized camera setup in the center of a lecture hall
                  </li>
                  <li>
                    The camera should be placed in the general area the students
                    are expected to be looking in. This is to avoid false lack
                    of attention flags
                  </li>
                  <li>
                    The Lecture hall should be well lit to improve visibility
                  </li>
                  <li>
                    Remind students to fully raise their hand above their head
                    to accurately capture their questions. The longer a hand is
                    raised the more likely it is to be correctly captured. Hands
                    raised for a short amount of time will not be counted to
                    rule out false flags of questions
                  </li>
                </ol>
              </GuideSection>

              <GuideSection
                number={2}
                title="Model Selection Guide"
                value="model-selection"
              >
                <p>
                  It is recommended that you only run the Small or Medium models
                  if you have a capable system.
                </p>

                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>
                    <strong>Nano:</strong> Fastest and detects the highest
                    number of students, though with lower overall accuracy.
                  </li>
                  <li>
                    <strong>Small:</strong> Offers a balance between speed and
                    precision. It detects fewer students than Nano but
                    significantly reduces false positives.
                  </li>
                  <li>
                    <strong>Medium:</strong> Highest accuracy and lowest
                    false-positive rate, but runs the slowest and may detect
                    fewer individuals overall.
                  </li>
                </ol>
              </GuideSection>

              <GuideSection number={3} title="GPU Guide" value="gpu">
                <p>
                  The lecture watch feature is a computationally heavy task and
                  a computers GPU is required.
                </p>

                <p className="mt-3">
                  The GPU functionality should be enabled by default by any
                  modern browser, however if you run into issues these can be
                  altered in the settings of your browser.
                </p>

                <p className="mt-3">
                  The vision model runs best on Chrome and on Windows and macOS.
                  On Linux depending on the distribution some settings must be
                  enabled to achieve functionality of the feature.
                </p>
              </GuideSection>

              <GuideSection
                number={4}
                title="Chrome features to enable if GPU permissions failed"
                value="chrome-settings"
              >
                <p>
                  These are possible solutions however they are not guaranteed
                  to work for all cases.
                </p>

                <p className="mt-3">
                  A URL is provided to find the setting to enable:
                </p>

                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>
                    Vulkan: Enabled{" "}
                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
                      chrome://flags/#enable-vulkan
                    </code>
                  </li>

                  <li>
                    Force enable WebGPU interop: Enabled{" "}
                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
                      chrome://flags/#force-enable-webgpu-interop
                    </code>
                  </li>

                  <li>
                    Default ANGLE Vulkan: Enabled{" "}
                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
                      chrome://flags/#default-angle-vulkan
                    </code>
                  </li>

                  <li>
                    Vulkan from ANGLE:{" "}
                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs font-normal select-all dark:bg-white/10">
                      chrome://flags/#vulkan-from-angle
                    </code>
                  </li>
                </ol>
              </GuideSection>
            </div>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuideSection({
  number,
  title,
  value,
  children,
}: {
  number: number;
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-lg border border-[var(--border)] px-4"
    >
      <AccordionTrigger className="py-6 hover:no-underline">
        <div className="flex min-w-0 items-center gap-3 text-left">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-primary)]">
            {number}
          </div>

          <span className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-4 pl-12 text-sm leading-6 text-[var(--text-secondary)]">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
