import UniversityStats, {
  UniversityStatsData,
} from "@/components/organisms/stats/universityTab";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import CoursesTab, {
  CourseData,
} from "@/components/organisms/stats/coursesTab";

const mockUniversityStats: UniversityStatsData = {
  countCourses: 100,
  countEvents: 67,
  countModule: 420,
  numberOfStudents: 69690,
};

const mockCourseData: CourseData[] = [
  {
    id: "1",
    name: "Computer Science",
    countModules: 10,
    countEvents: 30,
    numberOfStudents: 67,
  },
  {
    id: "2",
    name: "Mathematics",
    countModules: 12,
    countEvents: 22,
    numberOfStudents: 152,
  },
];

export default async function statsPageTemplate() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] pb-2">
          Stats Dashboard
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          View various statistics and metrics related to the UMTAS system.
        </p>
      </div>

      <div>
        <Tabs defaultValue="university" className="w-full space-y-4">
          <TabsList className="w-full flex flex-wrap gap-2 h-auto p-2">
            <TabsTrigger value="university" className="px-4 py-2">
              University
            </TabsTrigger>
            <TabsTrigger value="courses" className="px-4 py-2">
              Courses
            </TabsTrigger>
            <TabsTrigger value="events" className="px-4 py-2">
              Events
            </TabsTrigger>
            <TabsTrigger value="modules" className="px-4 py-2">
              Modules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="university" className="space-y-6">
            <UniversityStats
              data={mockUniversityStats}
              isLoading={false}
              isError={false}
            />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab
              data={mockCourseData}
              isLoading={false}
              isError={false}
            />
          </TabsContent>

          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
          </TabsContent>

          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
