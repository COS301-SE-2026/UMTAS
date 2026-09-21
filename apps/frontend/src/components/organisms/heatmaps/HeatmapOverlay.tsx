"use client";

import { useHeatmapOverlay } from "@/hooks/useHeatmapOverlay";
import { WeightedPoint } from "../../../../utilities/heatmaps/heatmapAdapter";

interface HeatmapOverlayProps {
  buildingPoints: WeightedPoint[];
  routePoints: WeightedPoint[];
}

//simple wrapper for the heatmap overlay
export function HeatmapOverlay({
  buildingPoints,
  routePoints,
}: HeatmapOverlayProps) {
  useHeatmapOverlay({ buildingPoints, routePoints });
  return null;
}
