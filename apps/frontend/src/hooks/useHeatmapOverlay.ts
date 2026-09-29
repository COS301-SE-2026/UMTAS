"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import {
  getMedianAndMax,
  WeightedPoint,
} from "../../utilities/heatmaps/heatmapAdapter";
import { useEffect, useMemo, useRef, useState } from "react";

//temporary colours for the range. change as you go
const HEATMAP_COLOUR_RANGE: [number, number, number, number][] = [
  [59, 130, 246, 0], //none
  [59, 130, 246, 160], //low
  [250, 204, 21, 200], //median
  [239, 68, 68, 255], //max
];

//temporary for now until we get the simulation service up
//remember to tune this before sim service is up vro!
const HEATMAP_COLOUR_DOMAIN: [number, number] = [0, 75];

const METRES_PER_DEG_LAT = 111_320;

//for buildings
const BUILDING_WEIGHT_BOOST = 1.5;
const BUILDING_SPREAD_METRES = 20;
const BUILDING_RING_POINTS = 9;

//makes route points less warm
const ROUTE_CELL_METRES = 15;
const ROUTE_DENSITY_EXPONENT = 0.3; //closer to 1 counts density more, closer to 0 makes point density count less

//each building has a ring around it to simulate density
function spreadBuilding(point: WeightedPoint): WeightedPoint[] {
  const [lng, lat] = point.position;

  const dLat = BUILDING_SPREAD_METRES / METRES_PER_DEG_LAT;
  const dLng =
    BUILDING_SPREAD_METRES /
    (METRES_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));

  const boosted = point.weight * BUILDING_WEIGHT_BOOST;
  const result: WeightedPoint[] = [{ ...point, weight: boosted }];

  for (let i = 0; i < BUILDING_RING_POINTS; i++) {
    const angle = (i / BUILDING_RING_POINTS) * Math.PI * 2;

    result.push({
      ...point,
      position: [lng + Math.cos(angle) * dLng, lat + Math.sin(angle) * dLat],
      weight: boosted * 0.5,
    });
  }
  return result;
}

//prevents routes from clustering up and giving fake heatmap congestion
function thinRoutePoints(points: WeightedPoint[]): WeightedPoint[] {
  const cells = new Map<
    string,
    { lngSum: number; latSum: number; weightSum: number; count: number }
  >();

  for (const point of points) {
    const [lng, lat] = point.position;

    const cellLat = ROUTE_CELL_METRES / METRES_PER_DEG_LAT;
    const cellLng =
      ROUTE_CELL_METRES /
      (METRES_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));

    const key = `${Math.floor(lng / cellLng)}:${Math.floor(lat / cellLat)}`;

    const cell = cells.get(key) ?? {
      lngSum: 0,
      latSum: 0,
      weightSum: 0,
      count: 0,
    };

    cell.lngSum += lng;
    cell.latSum += lat;
    cell.weightSum += point.weight;
    cell.count += 1;
    cells.set(key, cell);
  }

  return Array.from(cells.values()).map((cell) => {
    const meanWeight = cell.weightSum / cell.count;
    return {
      position: [cell.lngSum / cell.count, cell.latSum / cell.count],
      //mean weight, scales up with more points (to prevent over sens routes)
      weight: meanWeight * Math.pow(cell.count, ROUTE_DENSITY_EXPONENT),
    } as WeightedPoint;
  });
}

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

  //one render instead of two
  const combinedPoints = useMemo(
    () => [
      ...buildingPoints.flatMap(spreadBuilding),
      ...thinRoutePoints(routePoints),
    ],
    [buildingPoints, routePoints],
  );

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

    const heatmapLayer = new HeatmapLayer<WeightedPoint>({
      id: "uni-heatmap",
      data: combinedPoints,
      getPosition: (dot) => dot.position,
      getWeight: (dot) => dot.weight,
      radiusPixels: radius,
      intensity: intensity * intensityScale,
      opacity: 0.7,
      colorRange: HEATMAP_COLOUR_RANGE,
      colorDomain: HEATMAP_COLOUR_DOMAIN,
    });

    overlayRef.current.setProps({
      layers: [heatmapLayer],
    });

    //console.log(radius, combinedPoints.length);
  }, [combinedPoints, radius, intensity, intensityScale]);
}
