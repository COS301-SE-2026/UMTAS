// this will house the data fetching overall
// Course management entails creating courses around a group of modules and applying metadata
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
import { useState } from "react";
import { getAllModulesQueries } from "@/app/course-management/queries/modules/moduleBuilder";
import { Card } from "@/components/atoms/baseShadcn/card";
// Will hold all the filters above the table, table is just an entity to hold data local usage

export default function CourseManagementTemplate() {
  const router = useRouter();
  const UniDetails = UserDetails.getUniDetails();
  const [moduleQueries, setModuleQueries] = useState<getAllModulesQueries>({
    universityId: UniDetails?.UniversityID,
  });

  if (UniDetails === null) {
    router.push("choose-institute");
  } else {
  }

  const {
    data: courseData = [],
    isLoading,
    isError,
  } = useQuery(
    getAllCoursesQ(), // do not choose this in merge conflict
  );

  const { data: moduleData } = useQuery(getAllModCoursesQ(moduleQueries));

  if (isLoading) {
    return (
      <div className="h-full w-full flex justify-center">
        <Spinner></Spinner>
      </div>
    );
  }

  if (isError) {
    return <div>Something went wrong :( </div>;
  }

  const data: CourseTableData[] = [
    ...courseData.map((course) => ({
      course,
      modules:
        moduleData?.filter((mod) => mod.ModuleGroupingID === course.GroupID) ??
        [],
    })),
  ];

  return (
    <div className="h-[80vh] items-center flex flex-col ">
      <Card className="h-1/4 w-1/2 mb-5 text-center">filters go here</Card>
      <CourseTable columns={courseCols} data={data}></CourseTable>
    </div>
  );
}
