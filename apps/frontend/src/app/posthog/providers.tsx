"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let headers = ["localhost:3001"];

    if (process.env.NEXT_PUBLIC_APP_ENV === "staging") {
      headers = ["https://staging.capstone-vigil.dns.net.za/api"];
    } else if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
      headers = ["https://capstone-vigil.dns.net.za/api"];
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PT as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
      tracing_headers: headers,
      capture_performance: true,
      capture_exceptions: true,
      enable_recording_console_log: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
