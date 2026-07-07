import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

// will be an array of
// Cours info and an array of all modules
export interface CourseTableData {
  course: CourseDTO;
  modules: moduleDTO[];
  // will be a list of modules filtered by university
  // then locally grouped by grouping id which will be added to endpoint to also return
}

const columnCreator = createColumnHelper<CourseTableData>();

function courseNameCol(): ColumnDef<CourseTableData, string> {
  return columnCreator.accessor("course.CourseName", {
    header: "Course name",
    cell: (info) => {
      const name = info.getValue();
      return <div>{name}</div>;
    },
  });
}
function DegreeCol(): ColumnDef<CourseTableData, string> {
  return columnCreator.accessor("course.Degree", {
    header: "Degree",
    cell: (info) => {
      const Dname = info.getValue();
      return <div>{Dname}</div>;
    },
  });
}
function ModulesColumn(): ColumnDef<CourseTableData, moduleDTO[]> {
  return columnCreator.accessor("modules", {
    header: "Course Modules",
    cell: (info) => {
      const modules = info.getValue();
      return modules.map((mod) => {
        return (
          <Badge key={mod.moduleID} className="bg-red-600">
            {mod.moduleCode}
          </Badge>
        );
      });
    },
  });
}
type CourseTableColumn =
  | ColumnDef<CourseTableData, string>
  | ColumnDef<CourseTableData, moduleDTO[]>;
export const courseCols: CourseTableColumn[] = [
  courseNameCol(),
  DegreeCol(),
  ModulesColumn(),
];
