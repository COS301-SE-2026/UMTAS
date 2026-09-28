"use client";

import {
  Activity,
  CalendarCheck,
  CalendarX,
  FileExclamationPoint,
  Gauge,
  Spline,
} from "lucide-react";
import {
  correlation,
  formatDate,
  percent,
  toChartRows,
  toDaily,
  toMetrics,
} from "../../../../utilities/vision-stats/VisionCalc";
import { VisionSession } from "../../../../utilities/vision-stats/VisionTypes";
import StatCard from "../stats/statCard";
import DynamicChart from "@/components/molecules/stats/newStatsChart";

interface VisionInsightsProps {
  data?: VisionSession[];
  isLoading?: boolean;
  isError?: boolean;
}

const describeCorrelation = (correlationValue: number | null) => {
  if (correlationValue === null) {
    return "Not enough data";
  }

  if (correlationValue <= -0.3) {
    return "More restlessness tends to mean lower attention";
  }

  if (correlationValue >= 0.3) {
    return "More restlessness tends to mean higher attention";
  }

  return "There is no clear link between restlessness and attention for the given data";
};

export default function VisionInsights({
  data,
  isLoading,
  isError,
}: VisionInsightsProps) {
  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-destructive)">
        Could not load insights
      </div>
    );
  }

  const sessions = data ?? [];

  const metricsData = sessions.map(toMetrics);
  const dailyMetrics = toDaily(metricsData);
  const chartRows = toChartRows(dailyMetrics);

  const bestDateSession = [...dailyMetrics].sort(
    (x, y) => y.engagement - x.engagement,
  )[0];

  const worstDateSession = [...dailyMetrics].sort(
    (x, y) => x.engagement - y.engagement,
  )[0];

  const correlationScore = correlation(
    metricsData.map((metric) => metric.restlessPercentage),
    metricsData.map((metric) => metric.attentionPercentage),
  );

  const averageEngagementScore = () => {
    if (metricsData.length <= 0) {
      return 0;
    }

    const averageScore =
      metricsData.reduce((total, metric) => total + metric.engagement, 0) /
      metricsData.length;

    return Number(averageScore.toFixed(1));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Average Engagement Score"
          value={percent(averageEngagementScore() ?? 0)}
          description="Average of still % and attention %"
          isLoading={isLoading}
          icon={<Gauge className={"h-4 w-4"} />}
        />

        <StatCard
          title="Best Engagement Date"
          value={bestDateSession ? percent(bestDateSession.engagement) : "-"}
          description={bestDateSession ? formatDate(bestDateSession.date) : ""}
          isLoading={isLoading}
          icon={<CalendarCheck className={"h-4 w-4"} />}
        />
        <StatCard
          title="Worst Engagement Date"
          value={worstDateSession ? percent(worstDateSession.engagement) : "-"}
          description={
            worstDateSession ? formatDate(worstDateSession.date) : ""
          }
          isLoading={isLoading}
          icon={<CalendarX className={"h-4 w-4"} />}
        />
        <StatCard
          title="Restlessness vs Attention"
          value={correlationScore === null ? "-" : correlationScore.toFixed(2)}
          description={describeCorrelation(correlationScore)}
          isLoading={isLoading}
          icon={<Spline />}
        />
      </div>

      <DynamicChart
        title="Engagement Score"
        description="Combined still % and attention %, by date"
        type="line"
        data={chartRows}
        config={{
          engagement: { label: "Engagement", color: "var(--chart-1)" },
        }}
        xKey="xKey"
        yKey={["engagement"]}
        isLoading={isLoading}
        emptyMessage="No sessions match these filters"
        height={300}
      />
    </div>
  );
}
