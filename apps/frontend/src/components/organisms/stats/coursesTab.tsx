import { BookOpen, Hash, Users, XLineTop } from "lucide-react";
import StatCard from "./statCard";
import DynamicChart from "@/components/molecules/stats/newStatsChart";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";

export interface CourseData {
  id: string;
  name: string;
  countEvents: number;
  countModules: number;
  numberOfStudents: number;
}

export interface CoursesTabProps {
  data?: CourseData[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function CoursesTab({
  data,
  isLoading,
  isError,
}: CoursesTabProps) {
  if (isError === true) {
    return (
      <div className="flex items-center justify-center text-[var(--destructive)]">
        Could not load chart
      </div>
    );
  }

  const coursesData = data ?? [];

  const topCourseByStudents = [...coursesData]
    .sort((x, y) => y.numberOfStudents - x.numberOfStudents)
    .slice(0, 10)
    .map((course) => ({
      xKey: course.name,
      count: course.numberOfStudents,
    }));

  const topCourseByEvents = [...coursesData]
    .sort((x, y) => y.countEvents - x.countEvents)
    .slice(0, 10)
    .map((course) => ({ xKey: course.name, eventCount: course.countEvents }));

  const topCourseByModules = [...coursesData]
    .sort((x, y) => y.countModules - x.countModules)
    .slice(0, 10)
    .map((course) => ({ xKey: course.name, moduleCount: course.countModules }));

  const topEventCourse = [...coursesData].sort(
    (x, y) => y.countEvents - x.countEvents,
  )[0];
  const topModuleCourse = [...coursesData].sort(
    (x, y) => y.countModules - x.countModules,
  )[0];

  const averageStudentCountPerCourse = () => {
    if (coursesData.length <= 0) {
      return 0;
    }

    const average =
      coursesData.reduce(
        (total, course) => total + course.numberOfStudents,
        0,
      ) / coursesData.length;

    return average;
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Courses"
          value={coursesData?.length ?? 0}
          isLoading={isLoading}
          icon={<BookOpen className={"h-4 w-4"} />}
        />
        <StatCard
          title="Course with Most Events"
          value={topCourseByEvents[0]?.eventCount ?? 0}
          description={topEventCourse?.name ?? ""}
          isLoading={isLoading}
          icon={<Hash className={"h-4 w-4"} />}
        />
        <StatCard
          title="Course with Most Modules"
          value={topCourseByModules[0]?.moduleCount ?? 0}
          description={topModuleCourse?.name ?? ""}
          isLoading={isLoading}
          icon={<Hash className={"h-4 w-4"} />}
        />
        <StatCard
          title="Average Student Count Per Course"
          value={averageStudentCountPerCourse() ?? 0}
          isLoading={isLoading}
          icon={<XLineTop className={"h-4 w-4"} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DynamicChart
          title="Top 10 Courses by Student Count"
          type="bar-horizontal"
          data={topCourseByStudents}
          config={{
            count: { label: "Students", color: "var(--chart-1)" },
          }}
          xKey="xKey"
          yKey={["count"]}
          isLoading={isLoading}
          emptyMessage="No student count data available"
          height={300}
        />
        <DynamicChart
          title="Top 10 Courses by Event Count"
          type="bar-horizontal"
          data={topCourseByEvents}
          config={{
            eventCount: { label: "Events", color: "var(--chart-2)" },
          }}
          xKey="xKey"
          yKey={["eventCount"]}
          isLoading={isLoading}
          emptyMessage="No module data available"
          height={300}
        />
        <DynamicChart
          title="Top 10 Courses by Module Count"
          type="bar-horizontal"
          data={topCourseByModules}
          config={{
            moduleCount: { label: "Modules", color: "var(--chart-3)" },
          }}
          xKey="xKey"
          yKey={["moduleCount"]}
          isLoading={isLoading}
          emptyMessage="No module data available"
          height={300}
        />
      </div>

      <div className="rounded-lg border">
        <h2 className="font-bold text-[var(--text-primary)] p-4">
          All Courses
        </h2>
        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Student Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesData.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.countEvents}</TableCell>
                    <TableCell>{course.countModules}</TableCell>
                    <TableCell>{course.numberOfStudents}</TableCell>
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
