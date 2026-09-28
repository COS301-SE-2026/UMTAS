"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

interface UseRouteLineOptions {
  path: { lat: number; lng: number }[];
  colour?: string;
  onClick?: () => void;
  onHover?: (position: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
}

export function useRouteLine({
  path,
  colour = "#0000FF",
  onClick,
  onHover,
  onHoverEnd,
}: UseRouteLineOptions) {
  const map = useMap();
  const polylineReference = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    const polyline = new google.maps.Polyline({
      path: path,
      strokeColor: colour,
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map,
    });

    polylineReference.current = polyline;

    const listener = polyline.addListener("click", () => {
      onClick?.();
    });

    const mouseOverListener = polyline.addListener(
      "mouseover",
      (event: google.maps.MapMouseEvent) => {
        if (!event.domEvent) return;

        const mouseEvent = event.domEvent as MouseEvent;

        onHover?.({
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        });
      },
    );

    const mouseMoveListener = polyline.addListener(
      "mousemove",
      (event: google.maps.MapMouseEvent) => {
        if (!event.domEvent) return;

        const mouseEvent = event.domEvent as MouseEvent;

        onHover?.({
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        });
      },
    );

    const mouseOutListener = polyline.addListener("mouseout", () => {
      onHoverEnd?.();
    });

    return () => {
      listener.remove();

      mouseOverListener.remove();
      mouseMoveListener.remove();
      mouseOutListener.remove();

      polyline.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (polylineReference.current) {
      polylineReference.current.setPath(path);
      polylineReference.current.setOptions({ strokeColor: colour });
    }
  }, [path, colour]);
}
