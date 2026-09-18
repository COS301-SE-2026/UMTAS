"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import {
  getMedianAndMax,
  WeightedPoint,
} from "../../utilities/heatmaps/heatmapAdapter";
import { useEffect, useRef } from "react";

//temporary colours for the range. change as you go
const HEATMAP_COLOUR_RANGE: [number, number, number, number][] = [
  [59, 130, 246, 0], //none
  [59, 130, 246, 160], //low
  [250, 204, 21, 200], //median
  [239, 68, 68, 255], //max
];

interface UseHeatmapOverlayOptions {
  buildingPoints: WeightedPoint[];
  routePoints: WeightedPoint[];
  radiusPixels?: number;
  intensity?: number;
}

export function useHeatmapOverlay({
  buildingPoints,
  routePoints,
  radiusPixels = 40,
  intensity = 1,
}: UseHeatmapOverlayOptions) {
  const map = useMap();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    overlayRef.current = new GoogleMapsOverlay({ layers: [] });
    overlayRef.current.setMap(map);

    return () => {
      overlayRef.current?.setMap(null);
      overlayRef.current?.finalize();
      overlayRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!overlayRef.current) {
      return;
    }

    const buildingWeights = buildingPoints.map((point) => point.weight);
    const buildingScale = getMedianAndMax(buildingWeights);

    const routeWeights = routePoints.map((point) => point.weight);
    const routeScale = getMedianAndMax(routeWeights);

    const buildingHeatmapLayer = new HeatmapLayer<WeightedPoint>({
      id: "uni-heatmap-buildings",
      data: buildingPoints,
      getPosition: (dot) => dot.position,
      getWeight: (dot) => dot.weight,
      radiusPixels,
      intensity,
      colorRange: HEATMAP_COLOUR_RANGE,
      colorDomain: [0, buildingScale.max || 1],
    });

    const routeHeatmapLayer = new HeatmapLayer<WeightedPoint>({
      id: "uni-heatmap-routes",
      data: routePoints,
      getPosition: (dot) => dot.position,
      getWeight: (dot) => dot.weight,
      radiusPixels,
      intensity,
      colorRange: HEATMAP_COLOUR_RANGE,
      colorDomain: [0, routeScale.max || 1],
    });

    overlayRef.current.setProps({
      layers: [buildingHeatmapLayer, routeHeatmapLayer],
    });
  }, [buildingPoints, routePoints, radiusPixels, intensity]);
}
