"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";

interface UniMapProps {
  apiKey: string | undefined;
}

export default function UniMap({ apiKey }: UniMapProps) {
  if (!apiKey) {
    return <div>Loading map... (or Missing API Key)</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: "100vw", height: "100vh" }}
        defaultCenter={{ lat: -25.7479, lng: 28.2293 }}
        defaultZoom={10}
      />
    </APIProvider>
  );
}
