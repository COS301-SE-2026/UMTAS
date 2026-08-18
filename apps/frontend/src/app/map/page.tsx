"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";

const MAPS_KEY = process.env.MAPS_KEY || "";

export default function App() {
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <Map
        style={{ width: "100vw", height: "100vh" }}
        defaultCenter={{ lat: -25.7479, lng: 28.2293 }}
        defaultZoom={10}
      />
    </APIProvider>
  );
}
