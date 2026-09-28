import { Hash, Layers, Notebook } from "lucide-react";
import {
  average,
  toChartRows,
  toDaily,
  toMetrics,
} from "../../../../utilities/vision-stats/VisionCalc";
import {
  VisionEvent,
  VisionSession,
} from "../../../../utilities/vision-stats/VisionTypes";
import StatCard from "../stats/statCard";
import DynamicChart from "@/components/molecules/stats/newStatsChart";

interface VisionModuleProps {
  moduleSelected: boolean;
  events: VisionEvent[];
  data?: VisionSession[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function VisionModule({
  moduleSelected,
  events,
  data,
  isLoading,
  isError,
}: VisionModuleProps) {
  if (!moduleSelected) {
    return (
      <div className="flex items-center justify-center text-text-secondary">
        Please Select a Module
      </div>
    );
  }

  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-[var(--destructive)]">
        Could Not Load Stats
      </div>
    );
  }

  const sessions = data ?? [];
  const eventsData = events ?? [];

  const metricsData = sessions.map(toMetrics);
  const trendData = toChartRows(toDaily(metricsData));

  const eventStats = eventsData.flatMap((event) => {
    const sessionGroup = metricsData.filter(
      (metric) => metric.eventId === event.id,
    );

    if (sessionGroup.length === 0) {
      return [];
    }

    return [
      {
        xKey: event.name,
        restlessPercentage: average(
          sessionGroup.map((metric) => metric.restlessPercentage),
        ),
        stillPercentage: average(
          sessionGroup.map((metric) => metric.stillPercentage),
        ),
        questions: average(sessionGroup.map((metric) => metric.questions)),
      },
    ];
  });

  const averageQuestionsPerSession = () => {
    if (metricsData.length <= 0) {
      return 0;
    }

    const averageQuestionns =
      metricsData.reduce((total, metric) => total + metric.questions, 0) /
      metricsData.length;

    return Number(averageQuestionns.toFixed(1));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Sessions in Module"
          value={metricsData.length ?? 0}
          isLoading={isLoading}
          icon={<Layers className={"h-4 w-4"} />}
        />
        <StatCard
          title="Events with Sessions"
          value={eventStats.length ?? 0}
          isLoading={isLoading}
          icon={<Notebook className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Questions per Session"
          value={averageQuestionsPerSession() ?? 0}
          isLoading={isLoading}
          icon={<Hash className={"h-4 w-4"} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DynamicChart
          title="Restless vs Still % by Event"
          description="Average per event in this module"
          type="bar-grouped"
          data={eventStats}
          config={{
            restlessPercentage: {
              label: "Restless %",
              color: "var(--chart-1)",
            },
            stillPercentage: { label: "Still %", color: "var(--chart-2)" },
          }}
          xKey="xKey"
          yKey={["restlessPercentage", "stillPercentage"]}
          isLoading={isLoading}
          emptyMessage="No sessions for this module"
          height={300}
        />
        <DynamicChart
          title="Average Questions by Event"
          type="bar"
          data={eventStats}
          config={{
            questions: { label: "Questions", color: "var(--chart-1)" },
          }}
          xKey="xKey"
          yKey={["questions"]}
          isLoading={isLoading}
          emptyMessage="No sessions for this module"
          height={300}
        />
        <DynamicChart
          className="lg:col-span-2"
          title="Module Trend"
          description="All sessions in the module by date"
          type="line"
          data={trendData}
          config={{
            restlessPercentage: {
              label: "Restless %",
              color: "var(--destructive)",
            },
            stillPercentage: { label: "Still %", color: "var(--success-text)" },
            attentionPercentage: {
              label: "Attention %",
              color: "var(--chart-2)",
            },
          }}
          xKey="xKey"
          yKey={[
            "restlessPercentage",
            "stillPercentage",
            "attentionPercentage",
          ]}
          isLoading={isLoading}
          emptyMessage="No sessions for this module"
          height={350}
        />
      </div>
    </div>
  );
}
