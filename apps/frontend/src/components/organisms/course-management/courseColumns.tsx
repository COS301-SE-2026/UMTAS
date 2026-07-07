import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

interface CourseTableData {
  course: CourseDTO;
  modules: ModuleResponseDto;
  // will be a list of modules filtered by university
  // then locally grouped by grouping id which will be added to endpoint to also return
}

const columnCreator = createColumnHelper<CourseDTO>();

function courseNameCol() {
  return columnCreator.accessor("CourseName", {
    header: "Course name",
    cell: (info) => {
      const name = info.getValue();
      return name;
    },
  });
}
function DegreeCol() {
  return columnCreator.accessor("Degree", {
    header: "Course name",
    cell: (info) => {
      const name = info.getValue();
      return name;
    },
  });
}

export const courseCols = [courseNameCol()];
