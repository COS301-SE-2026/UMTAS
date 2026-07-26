import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Table as ShadTable,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";
import CustomiseShell from "@/components/templates/customise/CustomiseShell";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Card } from "@/components/atoms/baseShadcn/card";
import Popup from "@/components/atoms/utility/floatContainer";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ModuleTableData } from "./ModuleColumns";
import CreateEventAdmin from "./addEvent";
import { UserDetails } from "@/lib/userclass/userClass";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { CourseSelect } from "./selectedCourse";
import { useMutation } from "@tanstack/react-query";
import { addModuleToCourseQ } from "@/app/course-management/queries/courses/courseQueries";

interface DataTableProps<TData> {
  columns: (ColumnDef<TData, string> | ColumnDef<TData, EventResponse[]>)[];
  data: TData[];
}

export function ModuleTable<TData>({ columns, data }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const [selectedCourse, setSelectedCourse] = useState<CourseDTO>({
    CourseID: "",
    CourseName: "",
    UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
  });
  const [dataState, setDataState] = useState<ModuleTableData>({
    events: [],
    modules: { moduleCode: "", moduleID: "", moduleName: "" },
  });

  const [showModPopup, updateModPopup] = useState(false);

  const { mutate: addModuleToCourseMut } = useMutation(addModuleToCourseQ());

  function showUpdateMod(param: ModuleTableData) {
    updateModPopup(true);
    setDataState(param);
  }

  return (
    <>
      <div className="h-full w-full  rounded-md items-center flex flex-col ">
        <Card className="w-3/4 h-3/4">
          <ShadTable className="text-center w-full mx-auto overflow-scroll">
            <CourseHeaders table={table} />
            <CourseTableBody table={table} setPopUp={showUpdateMod} />
          </ShadTable>
        </Card>
      </div>

      {showModPopup && (
        <Popup>
          <div className="w-3/4 items-center p-5 justify-center flex flex-col center h-9/10 bg-[var(--bg-surface)] h-fit">
            <div className="flex flex-row items-center">
              <Card className="w-fit h-fit">
                <CourseSelect
                  CourseState={selectedCourse}
                  updateCourseState={setSelectedCourse}
                >
                  <Button
                    onClick={() =>
                      addModuleToCourseMut({
                        body: { modules: [dataState.modules.moduleID] },
                        path: { CourseID: selectedCourse.CourseID },
                      })
                    }
                  >
                    {" "}
                    Add Module to Course
                  </Button>
                </CourseSelect>
              </Card>
              <CustomiseShell
                modules={[dataState.modules]}
                events={dataState.events}
              />
              <CreateEventAdmin module={dataState.modules} />
            </div>
            <Button className="w-1/10" onClick={() => updateModPopup(false)}>
              Close
            </Button>
          </div>
        </Popup>
      )}
    </>
  );
}

function CourseHeaders<TData>({ table }: { table: Table<TData> }) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </TableHeader>
  );
}

function CourseTableBody<TData>({
  table,
  setPopUp,
}: {
  table: Table<TData>;
  setPopUp: (dataState: ModuleTableData) => void;
}) {
  const rows = table.getRowModel().rows;
  const empty = rows.length === 0;
  return (
    <tbody>
      {empty ? (
        <TableRow className="">
          <TableCell></TableCell>
          <TableCell>There are no rows to display</TableCell>
          <TableCell></TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow id="row-module-row" key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                onClick={() => {
                  const original = row.original as ModuleTableData;
                  setPopUp(original);
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
    </tbody>
  );
}
