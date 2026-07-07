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
// Will hold all the filters above the table, table is just an entity to hold data local usage

export default function CourseManagementTemplate() {
  const router = useRouter();
  const UniDetails = UserDetails.getUniDetails();

  if (UniDetails === null) {
    router.push("choose-institute");
  }

  const {
    data: courseData = [],
    isLoading,
    isError,
  } = useQuery(
    getAllCoursesQ({ universityId: UniDetails?.UniversityID ?? "" }),
  );

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

  const data: CourseTableData[] = courseData.map((course) => ({
    course,
    modules: [],
  }));

  return <CourseTable columns={courseCols} data={data}></CourseTable>;
}
