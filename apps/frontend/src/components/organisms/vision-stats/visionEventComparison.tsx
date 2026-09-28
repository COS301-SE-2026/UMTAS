"use client";

import {
  SessionMetrics,
  VisionEvent,
  VisionFilters,
  VisionSession,
} from "../../../../utilities/vision-stats/VisionTypes";
import {
  average,
  toChartRows,
  toDaily,
  toMetrics,
} from "../../../../utilities/vision-stats/VisionCalc";
import StatCard from "../stats/statCard";
import { BarChart3, Eye, HelpCircle, Layers } from "lucide-react";
import DynamicChart from "@/components/molecules/stats/newStatsChart";

export interface VisionEventComparisonProps {
  events: VisionEvent[];
  selectedEventId?: string;
  filters?: VisionFilters;
  data?: VisionSession[];
  isLoading?: boolean;
  isError?: boolean;
}

const getDifferenceLabel = (
  selectedValue: number,
  averageValue: number,
  unit: string = "",
) => {
  const difference = Number((selectedValue - averageValue).toFixed(1));
  const sign = difference >= 0 ? "+" : "";
  return `${sign}${difference}${unit} vs overall event average`;
};

export default function VisionEventComparison({
  events,
  selectedEventId,
  filters,
  data,
  isLoading,
  isError,
}: VisionEventComparisonProps) {
  if (!selectedEventId) {
    return (
      <div className="flex items-center justify-center py-10 text-text-secondary">
        Select an event in the filter bar above to see its occurrences
      </div>
    );
  }

  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-destructive">
        Could not load event sessions
      </div>
    );
  }

  const rawSessions = data ?? [];
  const allEventMetrics = rawSessions
    .map(toMetrics)
    .sort((x, y) => x.date.localeCompare(y.date));

  const filteredMetrics = allEventMetrics.filter((metric) => {
    const afterFrom = !filters?.from || metric.date >= filters.from;
    const beforeTo = !filters?.to || metric.date <= filters.to;
    return afterFrom && beforeTo;
  });

  const chartRows = toChartRows(toDaily(filteredMetrics));
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const eventName = selectedEvent ? selectedEvent.name : "";

  const calculateStatistic = (key: keyof SessionMetrics, unit: string = "") => {
    const overallAverage = average(
      allEventMetrics.map((metric) => metric[key] as number),
    );
    const periodAverage = average(
      filteredMetrics.map((metric) => metric[key] as number),
    );

    const hasDateFilter = Boolean(filters?.from || filters?.to);

    if (!hasDateFilter) {
      return {
        value: `${overallAverage}${unit}`,
        description: `Average across all ${allEventMetrics.length} occurrences`,
      };
    }

    return {
      value: `${periodAverage}${unit}`,
      description: getDifferenceLabel(periodAverage, overallAverage, unit),
    };
  };

  const questionStats = calculateStatistic("questions");
  const restlessStats = calculateStatistic("restlessPercentage", "%");
  const stillStats = calculateStatistic("stillPercentage", "%");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Occurrences"
          value={filteredMetrics.length}
          description={
            filters?.from || filters?.to
              ? `${filteredMetrics.length} of ${allEventMetrics.length} sessions`
              : eventName
          }
          isLoading={isLoading}
          icon={<Layers className={"h-4 w-4"} />}
        />
        <StatCard
          title="Questions"
          value={questionStats.value}
          description={questionStats.description}
          isLoading={isLoading}
          icon={<HelpCircle className={"h-4 w-4"} />}
        />
        <StatCard
          title="Restless"
          value={restlessStats.value}
          description={restlessStats.description}
          isLoading={isLoading}
          icon={<BarChart3 className={"h-4 w-4"} />}
        />
        <StatCard
          title="Still"
          value={stillStats.value}
          description={stillStats.description}
          isLoading={isLoading}
          icon={<Eye className={"h-4 w-4"} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DynamicChart
          title="Questions Asked"
          description="Occurrences over time"
          type="line"
          data={chartRows}
          config={{
            questions: { label: "Questions", color: "var(--chart-1)" },
          }}
          xKey="xKey"
          yKey={["questions"]}
          isLoading={isLoading}
          emptyMessage="No sessions found for this date range"
          height={300}
        />

        <DynamicChart
          title="Restless %"
          type="line"
          data={chartRows}
          config={{
            restlessPercentage: {
              label: "Restless %",
              color: "var(--chart-2)",
            },
          }}
          xKey="xKey"
          yKey={["restlessPercentage"]}
          isLoading={isLoading}
          emptyMessage="No sessions found for this date range"
          height={300}
        />

        <DynamicChart
          title="Still %"
          type="line"
          data={chartRows}
          config={{
            stillPercentage: { label: "Still %", color: "var(--chart-3)" },
          }}
          xKey="xKey"
          yKey={["stillPercentage"]}
          isLoading={isLoading}
          emptyMessage="No sessions found for this date range"
          height={300}
        />
      </div>
    </div>
  );
}
