"use client";
import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { courseCols } from "@/components/organisms/course-management/courseColumns";
import { CourseTable } from "@/components/organisms/course-management/courseTable";
import { UserDetails } from "@/lib/userclass/userClass";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CourseTableData } from "@/components/organisms/course-management/courseColumns";
import { getAllModCoursesQ } from "@/app/course-management/queries/modules/moduleQueries";
import { useState, useEffect, useMemo, Fragment } from "react";
import { getAllModulesQueries } from "@/app/course-management/queries/modules/moduleBuilder";
import { Card, CardDescription } from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Button } from "@/components/atoms/baseShadcn/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";

export default function CourseManagementTemplate() {
  const router = useRouter();
  const UniDetails = UserDetails.getUniDetails();
  const [moduleQueries, setModuleQueries] = useState<getAllModulesQueries>({
    universityId: UniDetails?.UniversityID,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("All");
  const [selectedModulePrefix, setSelectedModulePrefix] = useState("All");
  const [possibleCourses, setPossibleCourses] = useState<
    Record<string, boolean>
  >({});

  //forces you to pick an institude if you havent already
  useEffect(() => {
    if (UniDetails === null) {
      router.push("/choose-institute");
    }
  }, [UniDetails, router]);

  const {
    data: courseData = [],
    isLoading: isCourseLoading,
    isError: isCourseError,
  } = useQuery({
    ...getAllCoursesQ(),
    enabled: !!UniDetails?.UniversityID,
  });

  const { data: moduleData, isLoading: isModuleLoading } = useQuery(
    getAllModCoursesQ(moduleQueries),
  );

  //use memo for caching between renders
  const availableDegrees = useMemo(() => {
    const degrees = new Set<string>();

    courseData.forEach((course) => {
      if (course.Degree) {
        degrees.add(course.Degree);
      }
    });

    return Array.from(degrees);
  }, [courseData]);

  const availableModulePrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    moduleData?.forEach((module) => {
      const parentCourse = courseData.find(
        (course) => course.GroupID === module.ModuleGroupingID,
      );

      const matchesDegree =
        selectedDegree === "All" || parentCourse?.Degree === selectedDegree;

      if (matchesDegree && module.moduleCode) {
        const match = module.moduleCode.match(/^[A-Za-z]+/);
        if (match) {
          prefixes.add(match[0].toUpperCase());
        }
      }
    });

    return Array.from(prefixes);
  }, [moduleData, courseData, selectedDegree]);

  const effectiveModulePrefix =
    selectedModulePrefix !== "All" &&
    !availableModulePrefixes.includes(selectedModulePrefix)
      ? "All"
      : selectedModulePrefix;

  const filteredCourses: CourseTableData[] = useMemo(() => {
    const unfilteredCourses = courseData.map((course) => ({
      course,
      modules:
        moduleData?.filter(
          (module) => module.ModuleGroupingID === course.GroupID,
        ) ?? [],
    }));

    return unfilteredCourses.filter(({ course, modules }) => {
      const matchesDegree =
        selectedDegree === "All" || course.Degree === selectedDegree;

      const matchesModulePrefix =
        effectiveModulePrefix === "All" ||
        modules.some((module) =>
          module.moduleCode?.toUpperCase().startsWith(effectiveModulePrefix),
        );

      const searchLowercase = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        course.CourseName?.toLowerCase().includes(searchLowercase) ||
        course.Degree?.toLowerCase().includes(searchLowercase) ||
        modules.some(
          (module) =>
            module.moduleCode?.toLowerCase().includes(searchLowercase) ||
            module.moduleName?.toLowerCase().includes(searchLowercase),
        );

      return matchesDegree && matchesModulePrefix && matchesSearch;
    });
  }, [
    courseData,
    moduleData,
    selectedDegree,
    effectiveModulePrefix,
    searchQuery,
  ]);

  //here is where you see all courses that are possible for the selected degree
  const toggleExpand = (courseId: string) => {
    setPossibleCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  if (isCourseLoading || isModuleLoading) {
    return (
      <div className="h-full w-full flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isCourseError) {
    return (
      <div className="text-destructive text-center py-20">
        Something went wrong :(
      </div>
    );
  }

  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6">
      <Card className="w-full max-w-5xl p-6 flex flex-col md:flex-row gap-4 items-center bg-[var(--bg-surface)] border-[var(--border)] rounded-xl shadow-sm">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search courses, degrees, or module codes/names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--background)]"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Select value={selectedDegree} onValueChange={setSelectedDegree}>
            <SelectTrigger className="w-[180px] bg-[var(--background)]">
              <SelectValue placeholder="Filter Degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Degrees</SelectItem>
              {availableDegrees.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {degree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={effectiveModulePrefix}
            onValueChange={setSelectedModulePrefix}
          >
            <SelectTrigger className="w-sm bg-[var(--background)]">
              <SelectValue placeholder="Filter Module Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Module Types</SelectItem>
              {availableModulePrefixes.map((prefix) => (
                <SelectItem key={prefix} value={prefix}>
                  {prefix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardDescription></CardDescription>
      </Card>

      <div className="w-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[var(--border)]">
              <TableHead className="p-4 text-[var(--text-primary)] font-bold">
                Course Name
              </TableHead>
              <TableHead className="p-4 text-[var(--text-primary)] font-bold">
                Degree
              </TableHead>
              <TableHead className="p-4 text-[var(--text-primary)] font-bold">
                Modules Count
              </TableHead>
              <TableHead className="p-4 text-right text-[var(--text-primary)] font-bold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="p-8 text-center text-[var(--text-secondary)]"
                >
                  No courses found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map(({ course, modules }) => {
                const isExpanded = possibleCourses[course.CourseID];
                return (
                  <Fragment key={course.CourseID}>
                    <TableRow className="border-b border-[var(--border)] brand-table-hover">
                      <TableCell className="p-4 font-medium text-[var(--text-primary)]">
                        {course.CourseName}
                      </TableCell>
                      <TableCell className="p-4 text-[var(--text-secondary)]">
                        {course.Degree}
                      </TableCell>
                      <TableCell className="p-4 text-[var(--text-secondary)]">
                        {modules.length} modules
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleExpand(course.CourseID)}
                        >
                          {isExpanded ? "Hide Modules" : "View Modules"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow
                        key={`${course.CourseID}-modules`}
                        className="bg-[var(--bg-elevated)]/20 border-b border-[var(--border)]"
                      >
                        <TableCell colSpan={4} className="p-6 pl-12">
                          <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
                            Associated Modules:
                          </div>
                          {modules.length === 0 ? (
                            <div className="text-sm text-[var(--text-disabled)] italic">
                              No modules assigned to this course group.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {modules.map((module) => (
                                <div
                                  key={module.moduleID}
                                  className="bg-[var(--background)] p-3 border border-[var(--border)] rounded-lg shadow-sm"
                                >
                                  <div className="font-bold text-[var(--text-primary)]">
                                    {module.moduleCode}
                                  </div>
                                  <div className="text-[var(--text-secondary)] text-xs mt-1">
                                    {module.moduleName}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
