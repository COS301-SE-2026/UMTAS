export type CongestionLevel = "low" | "medium" | "high";

//check useHeatmapOverlay colour domain,
// if you change something there also change this!!
const LOW_MAX = 50;
const MEDIUM_MAX = 100;

export function getCongestionLevel(count: number): CongestionLevel {
  if (count <= LOW_MAX) {
    return "low";
  }

  if (count <= MEDIUM_MAX) {
    return "medium";
  }

  return "high";
}

//records are readonly
export const CONGESTION_COLOURS: Record<CongestionLevel, string> = {
  low: "#739BD0",
  medium: "#FFEA00",
  high: "#FF0F0F",
};

export const CONGESTION_LABELS: Record<CongestionLevel, string> = {
  low: "Quiet",
  medium: "Busy",
  high: "Very Busy",
};
