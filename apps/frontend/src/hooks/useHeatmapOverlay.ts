"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import {
  getMedianAndMax,
  WeightedPoint,
} from "../../utilities/heatmaps/heatmapAdapter";
import { useEffect, useRef, useState } from "react";

//temporary colours for the range. change as you go
const HEATMAP_COLOUR_RANGE: [number, number, number, number][] = [
  [59, 130, 246, 0], //none
  [59, 130, 246, 160], //low
  [250, 204, 21, 200], //median
  [239, 68, 68, 255], //max
];

//temporary for now until we get the simulation service up
//remember to tune this before sim service is up vro!
const HEATMAP_COLOUR_DOMAIN: [number, number] = [0, 15];

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

  //this is to prevent the dots showing up when zooming in on the heatmap
  const [radius, setRadius] = useState(radiusPixels);
  const [intensityScale, setIntensityScale] = useState(1);

  useEffect(() => {
    if (!map) {
      return;
    }

    const REF_RADIUS_PIXELS = 40;

    function updateRadius() {
      const zoom = map?.getZoom() ?? 15;
      const lat = map?.getCenter()?.lat() ?? 0;
      //calculates metres per pixel for smooth transition. prayed to the math gods to help me
      const metresPerPixel =
        (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
      //change this with testing
      const wantedRadiusMetres = 40;

      const newRadius = wantedRadiusMetres / metresPerPixel;
      const MIN_RADIUS_PIXELS = 45;

      const finalRadius = Math.max(newRadius, MIN_RADIUS_PIXELS);

      setRadius(finalRadius);
      setIntensityScale(REF_RADIUS_PIXELS / finalRadius);
    }

    updateRadius();

    const listener = map.addListener("zoom_changed", updateRadius);
    return () => listener.remove();
  }, [map]);

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

    //const buildingWeights = buildingPoints.map((point) => point.weight);
    //const buildingScale = getMedianAndMax(buildingWeights);

    //const routeWeights = routePoints.map((point) => point.weight);
    //const routeScale = getMedianAndMax(routeWeights);

    const buildingHeatmapLayer = new HeatmapLayer<WeightedPoint>({
      id: "uni-heatmap-buildings",
      data: buildingPoints,
      getPosition: (dot) => dot.position,
      getWeight: (dot) => dot.weight,
      radiusPixels: radius * 5,
      intensity: intensity * intensityScale * 1.5,
      colorRange: HEATMAP_COLOUR_RANGE,
      colorDomain: HEATMAP_COLOUR_DOMAIN,
    });

    const routeHeatmapLayer = new HeatmapLayer<WeightedPoint>({
      id: "uni-heatmap-routes",
      data: routePoints,
      getPosition: (dot) => dot.position,
      getWeight: (dot) => dot.weight,
      radiusPixels: radius,
      intensity: intensity * intensityScale,
      opacity: 0.6,
      colorRange: HEATMAP_COLOUR_RANGE,
      colorDomain: HEATMAP_COLOUR_DOMAIN,
    });

    overlayRef.current.setProps({
      layers: [buildingHeatmapLayer, routeHeatmapLayer],
    });

    //console.log(radius, buildingPoints.length, routePoints.length);
  }, [buildingPoints, routePoints, radius, intensity, intensityScale]);
}
