"use client";

import { useState, useEffect } from "react";
import { Joyride, Step } from "react-joyride";

export default function Tutorial({
  steps,
  wait = false,
  eventName = "begin-tut",
}: {
  steps: Step[];
  wait?: boolean;
  eventName?: string;
}) {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const start = () => {
      setTourKey((prev) => prev + 1);
      setRun(true);
    };

    window.addEventListener(eventName, start);
    return () => window.removeEventListener(eventName, start);
  }, []);

  useEffect(() => {
    if (!wait) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRun(true);
    }
  }, [wait]);

  if (!mounted) return null;

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      // @ts-expect-error idk why this keeps giving an error but it works haha
      callback={(data: { status: string; action: string }) => {
        if (["finished", "skipped"].includes(data.status)) {
          setRun(false);
        }
      }}
    />
  );
}
