"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_PT;
    if (!key || posthog.__loaded) return;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_API_HOST ?? "https://eu.i.posthog.com",
      capture_pageview: "history_change",
      disable_session_recording: false,
      tracing_headers: [new URL(apiUrl).hostname],
      capture_performance: true,
      capture_exceptions: true,
      enable_recording_console_log: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "*",
        blockSelector: "img, video, canvas, .ph-no-capture",
        recordHeaders: false,
        recordBody: false,
      },
      loaded: (client) => {
        client.register({
          app_environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
        });
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
