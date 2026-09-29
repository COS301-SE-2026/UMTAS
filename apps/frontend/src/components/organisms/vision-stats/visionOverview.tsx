"use client";

import {
  Activity,
  Eye,
  Film,
  Flame,
  Hash,
  HelpCircle,
  Layers,
  Snowflake,
  Star,
} from "lucide-react";
import {
  average,
  percent,
  toChartRows,
  toDaily,
  toMetrics,
} from "../../../../utilities/vision-stats/VisionCalc";
import { VisionSession } from "../../../../utilities/vision-stats/VisionTypes";
import StatCard from "../stats/statCard";
import DynamicChart from "@/components/molecules/stats/newStatsChart";

export interface VisionOverviewProps {
  data?: VisionSession[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function VisionOverview({
  data,
  isLoading,
  isError,
}: VisionOverviewProps) {
  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-destructive">
        Could not load vision stats
      </div>
    );
  }

  const sessions = data ?? [];

  const metricsData = sessions.map(toMetrics);
  const chartRows = toChartRows(toDaily(metricsData));

  const mostRestlessSession = [...metricsData].sort(
    (x, y) => y.restlessPercentage - x.restlessPercentage,
  )[0];

  const mostStillSession = [...metricsData].sort(
    (x, y) => x.restlessPercentage - y.restlessPercentage,
  )[0];

  const mostQuestionsSession = [...metricsData].sort(
    (x, y) => y.questions - x.questions,
  )[0];

  const totalQuestions = metricsData.reduce(
    (total, metric) => total + metric.questions,
    0,
  );

  const totalFrames = metricsData.reduce(
    (total, metric) => total + metric.totalFrames,
    0,
  );

  const averageQuestionsPerSession = () => {
    if (metricsData.length <= 0) {
      return 0;
    }

    const averageQuestions = totalQuestions / metricsData.length;
    return Number(averageQuestions.toFixed(1));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Sessions"
          value={metricsData.length ?? 0}
          isLoading={isLoading}
          icon={<Layers className={"h-4 w-4"} />}
        />
        <StatCard
          title="Total Questions"
          value={totalQuestions ?? 0}
          isLoading={isLoading}
          icon={<HelpCircle className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Questions per Session"
          value={averageQuestionsPerSession() ?? 0}
          isLoading={isLoading}
          icon={<Hash className={"h-4 w-4"} />}
        />
        <StatCard
          title="Total Frames Analysed"
          value={totalFrames ?? 0}
          isLoading={isLoading}
          icon={<Film className={"h-4 w-4"} />}
        />
        <StatCard
          title="Most Questions"
          value={mostQuestionsSession?.questions ?? 0}
          description={mostQuestionsSession?.name ?? ""}
          isLoading={isLoading}
          icon={<Star className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Restless"
          value={percent(
            average(metricsData.map((metric) => metric.restlessPercentage)),
          )}
          isLoading={isLoading}
          icon={<Activity className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Still"
          value={percent(
            average(metricsData.map((metric) => metric.stillPercentage)),
          )}
          isLoading={isLoading}
          icon={<Snowflake className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Attention"
          value={percent(
            average(metricsData.map((metric) => metric.attentionPercentage)),
          )}
          isLoading={isLoading}
          icon={<Eye className={"h-4 w-4"} />}
        />
        <StatCard
          title="Most Restless Session"
          value={
            mostRestlessSession
              ? percent(mostRestlessSession.restlessPercentage)
              : "-"
          }
          description={mostRestlessSession?.name ?? ""}
          isLoading={isLoading}
          icon={<Activity className={"h-4 w-4"} />}
        />
        <StatCard
          title="Most Still Session"
          value={
            mostStillSession
              ? percent(mostStillSession.restlessPercentage)
              : "-"
          }
          description={mostStillSession?.name ?? ""}
          isLoading={isLoading}
          icon={<Snowflake className={"h-4 w-4"} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DynamicChart
          title="Questions Asked"
          description="Average per session, by date"
          type="line"
          data={chartRows}
          config={{
            questions: { label: "Questions", color: "var(--chart-1)" },
          }}
          xKey="xKey"
          yKey={["questions"]}
          isLoading={isLoading}
          emptyMessage="No sessions match these filters"
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
          emptyMessage="No sessions match these filters"
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
          emptyMessage="No sessions match these filters"
          height={300}
        />
        <DynamicChart
          title="Attention vs No Attention %"
          type="line"
          data={chartRows}
          config={{
            attentionPercentage: {
              label: "Paying attention",
              color: "var(--chart-1)",
            },
            noAttentionPercentage: {
              label: "No attention",
              color: "var(--chart-4)",
            },
          }}
          xKey="xKey"
          yKey={["attentionPercentage", "noAttentionPercentage"]}
          isLoading={isLoading}
          emptyMessage="No sessions match these filters"
          height={300}
        />
      </div>
    </div>
  );
}
