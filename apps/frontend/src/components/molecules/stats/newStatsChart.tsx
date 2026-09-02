"use client";

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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../../organisms/stats/statCard";

export interface ChartCardProps {
  title: string;
  description?: string;
  footer?: string | ReactNode;
  className?: string;
}

export interface DynamicChartProps {
  type:
    | "bar"
    | "bar-horizontal"
    | "bar-grouped"
    | "bar-stacked"
    | "area"
    | "line"
    | "pie"
    | "donut";
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
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
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
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
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
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
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
            {yKey.map((key) => (
              <Bar
                key={key}
                stackId="stack"
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {yKey.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                stroke={`var(--color-${key})`}
              />
            ))}
          </AreaChart>
        );
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {yKey.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                strokeWidth={2}
                stroke={`var(--color-${key})`}
              />
            ))}
          </LineChart>
        );
      case "pie":
      case "donut":
        return (
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            {yKey.map((key) => (
              <Pie
                key={key}
                data={data}
                dataKey={key}
                nameKey={xKey}
                innerRadius={type === "donut" ? 60 : 0}
                strokeWidth={5}
              />
            ))}
          </PieChart>
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
