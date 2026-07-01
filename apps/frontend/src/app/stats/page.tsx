import React from "react";
import HeatMapTemplate from "@/components/templates/stats/heatMapTemplate";

export default async function statsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">
        Stats Dashboard
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        View various statistics and metrics related to the Umtas system,
        including heatmaps, charts, and other visual representations of data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <HeatMapTemplate />
        <HeatMapTemplate />
        <HeatMapTemplate />
        <HeatMapTemplate />
        <HeatMapTemplate />
        <HeatMapTemplate />
        <HeatMapTemplate />
      </div>
    </div>
  );
}
