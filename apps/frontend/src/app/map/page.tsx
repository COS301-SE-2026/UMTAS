"use client";
import { UniMap } from "@/components/templates/map/UniMap";
import { APIProvider } from "@vis.gl/react-google-maps";

export default function MapPage() {
  const MAP_KEY = process.env.NEXT_PUBLIC_MAP_KEY || "";

  return (
    <div className="h-screen flex flex-col min-h-0">
      <APIProvider apiKey={MAP_KEY}>
        <UniMap />
      </APIProvider>
    </div>
  );
}
