import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/atoms/baseShadcn/chart";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import StatCard from "./statCard";

export interface ChartCardProps {
  title: string;
  description?: string;
  footer?: string | ReactNode;
  className?: string;
}

export interface DynamicChartProps {
  type: "bar" | "bar-horizontal" | "bar-grouped" | "bar-stacked";
  data: Record<string, string | number>[];
  config: ChartConfig;
  xKey: string;
  yKey: string[];
  height?: number | string;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
}

export default function DynamicChart({
  title,
  description,
  footer,
  className,
  type,
  data,
  config,
  xKey,
  yKey,
  height,
  isLoading,
  isError,
  emptyMessage,
}: DynamicChartProps & ChartCardProps) {
  const content = () => {
    if (isLoading === true) {
      return <Skeleton className="w-full" style={{ height }} />;
    }

    if (isError === true) {
      return (
        <div className="flex items-center justify-center text-[var(--destructive)]">
          Could not load chart
        </div>
      );
    }

    if (data === null || data.length <= 0) {
      return (
        <div className="flex items-center justify-center text-[var(--secondary)]">
          {emptyMessage}
        </div>
      );
    }

    return (
      <ChartContainer config={config} className="w-full" style={{ height }}>
        {chart()}
      </ChartContainer>
    );
  };

  const chart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {yKey.map((key) => (
              <Bar key={key} dataKey={key} fill={"var(--chart-2)"} radius={4} />
            ))}
          </BarChart>
        );
      case "bar-horizontal":
        return (
          <BarChart data={data} layout="vertical">
            <CartesianGrid vertical={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              dataKey={xKey}
              tickLine={false}
              type="category"
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {yKey.map((key) => (
              <Bar key={key} dataKey={key} fill={"var(--chart-2)"} radius={4} />
            ))}
          </BarChart>
        );
      case "bar-grouped":
        return (
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {yKey.map((key) => (
              <Bar key={key} dataKey={key} fill={"var(--chart-2)"} radius={4} />
            ))}
          </BarChart>
        );
      case "bar-stacked":
        return (
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {yKey.map((key) => (
              <Bar
                key={key}
                stackId="stack"
                dataKey={key}
                fill={"var(--chart-2)"}
                radius={4}
              />
            ))}
          </BarChart>
        );
      default:
        return null;
    }
  };
  return (
    <StatCard
      title={title}
      description={description}
      footer={footer}
      className={className}
    >
      {content()}
    </StatCard>
  );
}
