import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { Input } from "@/components/atoms/baseShadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { UserDetails } from "@/lib/userclass/userClass";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface CourseSelectProps {
  CourseState: CourseDTO;
  updateCourseState: (value: CourseDTO) => void;
  children?: ReactNode;
}
export function CourseSelect({
  CourseState,
  updateCourseState,
  children,
}: CourseSelectProps) {
  const [searchName, UpdateSearchName] = useState<string>("");

  const { data: courseData = [] } = useQuery(
    getAllCoursesQ({
      UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
      CourseName: searchName === "" ? undefined : searchName,
    }),
  );

  return (
    <div className="flex flex-col text-center items-center justify-center space-y-5">
      <label className="text-sm font-medium text-white text-center">
        Search for course
      </label>
      <Input
        className="text-center"
        placeholder="Search for course"
        value={searchName}
        onChange={(e) => {
          UpdateSearchName(e.target.value);
        }}
      />
      <label className="text-sm font-medium text-white text-center">
        Select Course
      </label>
      <Select
        value={CourseState.CourseID}
        onValueChange={(courseId) => {
          const course = courseData.find((c) => c.CourseID === courseId);
          if (course) updateCourseState(course);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select course" />
        </SelectTrigger>
        <SelectContent>
          {courseData.map((course) => (
            <SelectItem key={course.CourseID} value={course.CourseID}>
              {course.CourseName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {children}
    </div>
  );
}
