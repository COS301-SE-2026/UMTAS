"use client";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ReactNode } from "react";

export function MapProvider({ children }: { children: ReactNode }) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_MAP_KEY!}>
      {children}
    </APIProvider>
  );
}
