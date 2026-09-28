"use client";

import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import {
  percent,
  toMetrics,
} from "../../../../utilities/vision-stats/VisionCalc";
import { VisionSession } from "../../../../utilities/vision-stats/VisionTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";

interface VisionSessionsProps {
  data?: VisionSession[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function VisionSessions({
  data,
  isLoading,
  isError,
}: VisionSessionsProps) {
  if (isError === true) {
    return (
      <div className="flex items-center text-destructive justify-center">
        Could not load sessions
      </div>
    );
  }

  const sessions = data ?? [];

  const metricsData = sessions
    .map(toMetrics)
    .sort((x, y) => y.date.localeCompare(x.date));

  return (
    <div className="rounded-lg border">
      <h2 className="p-4 font-bold text-text-primary ">All Sessions</h2>

      {isLoading ? (
        <Skeleton className="w-full h-40" />
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-120">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Restless</TableHead>
                <TableHead>Still</TableHead>
                <TableHead>Attention</TableHead>
                <TableHead>Frames</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricsData.length <= 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-text-secondary"
                  >
                    No sessions match these filters
                  </TableCell>
                </TableRow>
              ) : (
                metricsData.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>{metric.name}</TableCell>
                    <TableCell>{metric.date}</TableCell>
                    <TableCell>{metric.questions}</TableCell>
                    <TableCell>{percent(metric.restlessPercentage)}</TableCell>
                    <TableCell>{percent(metric.stillPercentage)}</TableCell>
                    <TableCell>{percent(metric.attentionPercentage)}</TableCell>
                    <TableCell>{metric.totalFrames.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
