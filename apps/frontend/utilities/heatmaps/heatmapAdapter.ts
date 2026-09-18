import build from "next/dist/build";
import { BuildingHeatmapType } from "../building/buildingRequestBuilder";
import { RouteHeatmapType } from "../route/routeRequestBuilder";

export interface WeightedPoint {
  position: [number, number]; //remember deck.gl is [lng, lat], not [lat, lng] like in our system
  weight: number;
}

interface HourlyMetricBucket {
  hour: number;
  projected: number;
  worstCase?: number;
  actual?: unknown;
  projectedUtilisation?: number | null;
  worstCaseUtilisation?: number | null;
}

function maxInHourRange(
  hourly: HourlyMetricBucket[],
  fromHour: number,
  toHour: number,
): number {
  const bucketsInRange = hourly.filter(
    (bucket) => bucket.hour >= fromHour && bucket.hour <= toHour,
  );

  let max = 0;

  for (const bucket of bucketsInRange) {
    const value =
      bucket.projectedUtilisation ??
      bucket.worstCaseUtilisation ??
      bucket.projected ??
      0;

    if (value > max) {
      max = value;
    }
  }

  return max;
}

export function getMedianAndMax(weights: number[]): {
  median: number;
  max: number;
} {
  const nonZeroWeights = weights.filter((weight) => weight > 0);

  if (nonZeroWeights.length <= 0) {
    return { median: 0, max: 0 };
  }

  const sorted = [...nonZeroWeights].sort((x, y) => x - y);
  const middleIndex = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0
      ? (sorted[middleIndex - 1] + sorted[middleIndex]) / 2
      : sorted[middleIndex];

  const max = sorted[sorted.length - 1];

  return { median, max };
}

export function buildingHeatmapRangeToPoints(
  heatmaps: BuildingHeatmapType[],
  fromHour: number,
  toHour: number,
): WeightedPoint[] {
  return heatmaps
    .filter((heatmap) => heatmap.building?.location != null)
    .map((heatmap) => ({
      position: [
        heatmap.building.location!.lng,
        heatmap.building.location!.lat,
      ],
      weight: maxInHourRange(heatmap.hourly, fromHour, toHour),
    }));
}

//haversine formula copied and pasted from google
function haversineMetres(
  x: { lat: number; lng: number },
  y: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(y.lat - x.lat);
  const dLng = toRad(y.lng - x.lng);
  const lat1 = toRad(x.lat);
  const lat2 = toRad(y.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

//adjust this to fine tune the look. smaller = smoother line, more points
const HEATMAP_SPACING_METRES = 15;

export function routePathToPoints(
  path: { lat: number; lng: number }[],
  weight: number,
): WeightedPoint[] {
  const points: WeightedPoint[] = [];

  for (let i = 0; i < path.length; i++) {
    const start = path[i];
    const end = path[i + 1];
    const segmentLength = haversineMetres(start, end);
    const steps = Math.max(
      1,
      Math.floor(segmentLength / HEATMAP_SPACING_METRES),
    );

    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      points.push({
        position: [
          start.lng + (end.lng - start.lng) * t,
          start.lng + (end.lng - start.lng) * t,
        ],
        weight,
      });
    }
  }

  if (path.length > 0) {
    const last = path[path.length - 1];
    points.push({ position: [last.lng, last.lat], weight });
  }

  return points;
}

export function routeHeatmapRangeToPoints(
  routes: RouteHeatmapType[],
  fromHour: number,
  toHour: number,
): WeightedPoint[] {
  const points: WeightedPoint[] = [];

  for (const route of routes) {
    const weight = maxInHourRange(route.hourly, fromHour, toHour);

    if (weight <= 0) {
      continue;
    }

    points.push(...routePathToPoints(route.pathCoordinates, weight));
  }

  return points;
}
