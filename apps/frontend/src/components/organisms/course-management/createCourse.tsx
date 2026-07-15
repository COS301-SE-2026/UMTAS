import {
  CourseDTO,
  createCoursesBody,
} from "@/app/course-management/queries/courses/courseBuilder";
import { createCourseQ } from "@/app/course-management/queries/courses/courseQueries";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { useErrorListener } from "@/hooks/errorListener";
import { UserDetails } from "@/lib/userclass/userClass";
import { useMutation } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface CreateCourseProps {
  children?: ReactNode;
}

export function CreateCourse({ children }: CreateCourseProps) {
  const [course, setCourse] = useState<createCoursesBody>({
    CourseName: "",
    UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
  });
  function updateCourse(key: keyof createCoursesBody, value: string) {
    setCourse({
      ...course,
      [key]: value,
    });
  }

  const { mutate } = useMutation(createCourseQ());
  return (
    <div className=" w-full m-3 justify-center flex flex-col items-center space-y-4">
      <h1>Create course</h1>
      <CreateCourseInput
        state={{ course: course, updateCourse: updateCourse }}
        field="CourseName"
      />
      <CreateCourseInput
        state={{ course: course, updateCourse: updateCourse }}
        field="Degree"
      />
      <div className="flex flex-col w-1/2 space-y-1">
        <label className="text-sm font-medium text-white">
          University Name
        </label>
        <Input readOnly value={UserDetails.getUniDetails()?.UniversityName} />
      </div>

      <div className="flex flex-row items-center space-x-4">
        <Button
          onClick={() => {
            if (course.CourseName != "" && course.Degree != "") {
              mutate(course);
              setCourse({
                CourseName: "Course Name",
                UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
              });
            }
          }}
        >
          Create
        </Button>
        {children}
      </div>
    </div>
  );
}

interface createCourseInputProps {
  field: keyof createCoursesBody;
  state: StateHolder;
}
interface StateHolder {
  course: createCoursesBody;
  updateCourse: (key: keyof createCoursesBody, value: string) => void;
}

function CreateCourseInput({ field, state }: createCourseInputProps) {
  return (
    <div className="flex flex-col w-1/2 space-y-1">
      <label className="text-sm font-medium text-white">{field}</label>
      <Input
        value={state.course[field] ?? ""}
        onChange={(e) => state.updateCourse(field, e.target.value)}
      />
    </div>
  );
}
