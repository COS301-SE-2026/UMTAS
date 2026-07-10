"use client";

import { CreateModuleBody } from "@/app/course-management/queries/modules/moduleBuilder";
import { CreateModuleMutAdmin } from "@/app/course-management/queries/modules/moduleQueries";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card } from "@/components/atoms/baseShadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { StateInput } from "@/components/atoms/utility/stateInput";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { UserDetails } from "@/lib/userclass/userClass";
import { Input } from "@/components/atoms/baseShadcn/input";
interface CreateModuleProps {
  children?: ReactNode;
}

export default function CreateModuleAdmin({ children }: CreateModuleProps) {
  const [course, updateCourse] = useState<CourseDTO>({
    CourseID: "",
    CourseName: "",
    UniversityID: "",
  });
  const [module, updateMod] = useState<CreateModuleBody>({
    moduleCode: "",
    moduleName: "",
    moduleDescription: "",
    CourseID: "", // -> this needs to be set by our standard
    styling: { colour: "FFFF" },
  });
  function UpdateState(field: keyof CreateModuleBody, value: string) {
    updateMod((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const { mutateAsync: createModule } = useMutation(CreateModuleMutAdmin());

  return (
    <Card className="items-center w-full p-5 space-y-3">
      <h1 className="text-center text-2xl">Create Module</h1>
      <div className="flex flex-row w-full ">
        <div className="items-center flex flex-col  space-y-3 w-full">
          <StateInput State={module} update={UpdateState} field="moduleCode" />
          <StateInput
            State={module}
            update={UpdateState}
            field={"moduleName"}
          />
          <StateInput
            State={module}
            update={UpdateState}
            field={"moduleDescription"}
            type="text-area"
          />
          <div className="flex flex-col w-1/2 space-y-1">
            <label className="text-sm font-medium text-white">
              Choose colour
            </label>
            <input
              className="w-full"
              type="color"
              value={module.styling?.colour}
              onChange={(e) =>
                updateMod((prev) => ({
                  ...prev,
                  styling: { colour: e.target.value ?? "" },
                }))
              }
            ></input>
          </div>
        </div>
        <CourseSelect CourseState={course} updateCourseState={updateCourse} />
      </div>
      <div className="flex flex-row gap-x-5">
        <Button
          onClick={async () => {
            const result = await createModule({
              ...module,
              CourseID: course.CourseID,
            });
            if (result) {
              updateMod({
                moduleCode: "",
                moduleName: "",
                moduleDescription: "",
                CourseID: "", // -> this needs to be set by our standard
                styling: { colour: "FFFF" },
              });
            }
          }}
        >
          create
        </Button>

        {children}
      </div>
    </Card>
  );
}

interface CourseSelectProps {
  CourseState: CourseDTO;
  updateCourseState: (value: CourseDTO) => void;
}
function CourseSelect({ CourseState, updateCourseState }: CourseSelectProps) {
  const [searchName, UpdateSearchName] = useState<string>("");

  const {} = useQuery(getAllCoursesQ());
  const { data: courseData = [] } = useQuery(getAllCoursesQ());

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
    </div>
  );
}
