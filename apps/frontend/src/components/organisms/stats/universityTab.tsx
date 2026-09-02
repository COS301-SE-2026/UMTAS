import DynamicChart from "@/components/molecules/stats/newStatsChart";
import StatCard from "./statCard";
import { BookOpen, Calendar, GraduationCap, Users } from "lucide-react";

export interface UniversityStatsData {
  countEvents: number;
  countModule: number;
  countCourses: number;
  numberOfStudents: number;
}

export interface UniversityStatsProps {
  data?: UniversityStatsData;
  isLoading?: boolean;
  isError?: boolean;
}

export default function UniversityStats({
  data,
  isLoading,
  isError,
}: UniversityStatsProps) {
  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-[var(--destructive)]">
        Could not load chart
      </div>
    );
  }

  const dynamicChartData = data
    ? [
        { xKey: "Courses", count: data.countCourses },
        { xKey: "Events", count: data.countEvents },
        { xKey: "Modules", count: data.countModule },
      ]
    : [];

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="Courses"
          value={data?.countCourses}
          isLoading={isLoading}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Events"
          value={data?.countEvents}
          isLoading={isLoading}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Modules"
          value={data?.countModule}
          isLoading={isLoading}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatCard
          title="Students at University"
          value={data?.numberOfStudents}
          isLoading={isLoading}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <DynamicChart
        title="University Stats"
        description="Counts courses, events and modules."
        type="bar"
        data={dynamicChartData}
        config={{ count: { label: "Count", color: "var(--chart-1)" } }}
        xKey="xKey"
        yKey={["count"]}
        height={300}
        isLoading={isLoading}
        emptyMessage="No statistics available for this university"
      />
    </div>
  );
}
