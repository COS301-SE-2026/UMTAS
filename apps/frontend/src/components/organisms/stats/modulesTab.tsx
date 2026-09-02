import DynamicChart from "@/components/molecules/stats/newStatsChart";
import StatCard from "./statCard";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Flame, Hash, Notebook, Star, XLineTop } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";

export interface ModuleData {
  name: string;
  id: string;
  countEvents: number;
  numberOfStudents: number;
}

export interface ModulesTabProps {
  data?: ModuleData[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function ModulesTab({
  data,
  isLoading,
  isError,
}: ModulesTabProps) {
  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-[var(--destructive)]">
        Could not load
      </div>
    );
  }

  const modulesData = data ?? [];

  const topModuleByStudentCount = [...modulesData]
    .sort((x, y) => y.numberOfStudents - x.numberOfStudents)
    .slice(0, 10)
    .map((module) => ({
      xKey: module.name,
      studentCount: module.numberOfStudents,
    }));

  const topModuleByEventCount = [...modulesData]
    .sort((x, y) => y.countEvents - x.countEvents)
    .slice(0, 10)
    .map((module) => ({ xKey: module.name, countEvents: module.countEvents }));

  const topStudentModule = [...modulesData].sort(
    (x, y) => y.numberOfStudents - x.numberOfStudents,
  )[0];
  const topEventModule = [...modulesData].sort(
    (x, y) => y.countEvents - x.countEvents,
  )[0];

  const averageEventCountPerModule = () => {
    if (modulesData.length <= 0) {
      return 0;
    }

    const average =
      modulesData.reduce((total, module) => total + module.countEvents, 0) /
      modulesData.length;

    return average;
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Modules"
          value={modulesData.length}
          isLoading={isLoading}
          icon={<Notebook className={"h-4 w-4"} />}
        />
        <StatCard
          title="Module with Most Students"
          value={topModuleByStudentCount[0]?.studentCount}
          description={topStudentModule.name}
          isLoading={isLoading}
          icon={<Flame className={"h-4 w-4"} />}
        />
        <StatCard
          title="Module with the Most Events"
          value={topModuleByStudentCount[0]?.studentCount}
          description={topEventModule.name}
          isLoading={isLoading}
          icon={<Star className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Event Count Per Module"
          value={averageEventCountPerModule()}
          isLoading={isLoading}
          icon={<XLineTop className={"h-4 w-4"} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DynamicChart
          title="Top 10 Modules by Student Count"
          type="bar-horizontal"
          data={topModuleByStudentCount}
          config={{
            studentCount: { label: "Students", color: "var(--chart-1)" },
          }}
          xKey="xKey"
          yKey={["studentCount"]}
          isLoading={isLoading}
          emptyMessage="No student count data available"
          height={300}
        />
        <DynamicChart
          title="Top 10 Modules by Event Count"
          type="bar-horizontal"
          data={topModuleByEventCount}
          config={{
            countEvents: { label: "Events", color: "var(--chart-2)" },
          }}
          xKey="xKey"
          yKey={["countEvents"]}
          isLoading={isLoading}
          emptyMessage="No events data available"
          height={300}
        />
      </div>

      <div className="rounded-lg border">
        <h2 className="font-bold text-[var(--text-primary)] p-4">
          All Modules
        </h2>
        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Student Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modulesData.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>{module.name}</TableCell>
                    <TableCell>{module.countEvents}</TableCell>
                    <TableCell>{module.numberOfStudents}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
