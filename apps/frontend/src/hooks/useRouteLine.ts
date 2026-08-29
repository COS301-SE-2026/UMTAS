"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

interface UseRouteLineOptions {
  path: { lat: number; lng: number }[];
  colour?: string;
}

export function useRouteLine({
  path,
  colour = "#0000FF ",
}: UseRouteLineOptions) {
  const map = useMap();
  const polylineReference = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    polylineReference.current = new google.maps.Polyline({
      path: path,
      strokeColor: colour,
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map,
    });

    return () => {
      polylineReference.current?.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (polylineReference.current) {
      polylineReference.current.setPath(path);
      polylineReference.current.setOptions({ strokeColor: colour });
    }
  }, [path, colour]);
}
