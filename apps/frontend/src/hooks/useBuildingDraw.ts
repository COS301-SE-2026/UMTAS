"use client";
import { useMap } from "@vis.gl/react-google-maps";
import { useRef, useState, useEffect } from "react";

export function useBuildingDraw() {
  const map = useMap();
  const [mode, setMode] = useState<"none" | "draw" | "pin">("none");

  const [pinLocation, setPinLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [polygonPath, setPolygonPath] = useState<
    { lat: number; lng: number }[]
  >([]);

  const placedPolygonReference = useRef<google.maps.Polygon | null>(null);
  const placedPinReference = useRef<google.maps.Marker | null>(null);

  function reset() {
    setPolygonPath([]);
    setMode("none");
    setPinLocation(null);
  }

  function finishDrawing() {
    setMode("none");
  }

  function toGeoJSON() {
    //cannot be just a line
    if (polygonPath.length <= 2) {
      return null;
    }

    const polygon = polygonPath.map(
      (poly) => [poly.lng, poly.lat] as [number, number],
    );

    //connects the points
    polygon.push(polygon[0]);

    return { type: "Polygon" as const, coordinates: [polygon] };
  }

  //adds the points on the map to array when clicked
  useEffect(() => {
    if (!map || mode === "none") {
      return;
    }

    const mapListener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) {
          return;
        }

        const point = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        if (mode === "pin") {
          setPinLocation(point);
          setMode("none");
        } else if (mode === "draw") {
          setPolygonPath((previous) => [...previous, point]);
        }
      },
    );

    return () => {
      mapListener.remove();
    };
  }, [map, mode]);

  //shows the polygons that have been clicked
  useEffect(() => {
    if (!map) {
      return;
    }

    placedPolygonReference.current?.setMap(null);

    if (polygonPath.length > 0) {
      placedPolygonReference.current = new google.maps.Polygon({
        paths: polygonPath,
        strokeColor: "var(--btn-primary-bg)",
        strokeWeight: 1,
        fillColor: "var(--btn-primary-bg)",
        fillOpacity: 0.3,
        map: map,
      });
    }

    return () => {
      placedPolygonReference.current?.setMap(null);
    };
  }, [map, polygonPath]);

  useEffect(() => {
    if (!map) {
      return;
    }
    if (pinLocation != null) {
      if (!placedPinReference.current) {
        placedPinReference.current = new google.maps.Marker({
          position: pinLocation,
          map: map,
          animation: google.maps.Animation.DROP,
        });
      } else {
        placedPinReference.current.setPosition(pinLocation);
        placedPinReference.current.setMap(map);
      }
    } else {
      placedPinReference.current?.setMap(null);
    }

    return () => {
      placedPinReference.current?.setMap(null);
    };
  }, [map, pinLocation]);

  return {
    mode,
    setMode,
    pinLocation,
    polygonPath,
    reset,
    toGeoJSON,
    finishDrawing,
  };
}
