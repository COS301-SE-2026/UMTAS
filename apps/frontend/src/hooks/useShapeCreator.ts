"use client";
import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

type ShapeType = "polygon" | "polyline" | "circle";

interface ShapeOptions {
  polygon?: google.maps.PolygonOptions;
  polyline?: google.maps.PolylineOptions;
  circle?: google.maps.CircleOptions;
}

export function useShapeCreator(
  shapeType: ShapeType,
  shapeOptions: ShapeOptions,
) {
  const map = useMap();
  const shapeReference = useRef<
    google.maps.Polygon | google.maps.Polyline | google.maps.Circle | null
  >(null);

  (useEffect(() => {
    if (!map) {
      return;
    }

    if (shapeType === "polygon" && shapeOptions.polygon) {
      shapeReference.current = new google.maps.Polygon({
        ...shapeOptions.polygon,
        map,
      });
    } else if (shapeType === "polyline" && shapeOptions.polyline) {
      shapeReference.current = new google.maps.Polyline({
        ...shapeOptions.polyline,
        map,
      });
    } else if (shapeType === "circle" && shapeOptions.circle) {
      shapeReference.current = new google.maps.Circle({
        ...shapeOptions.circle,
        map,
      });
    }
  }),
    [map, shapeType, JSON.stringify(shapeOptions)]);
}
