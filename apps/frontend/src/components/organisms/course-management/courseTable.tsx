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
import { CourseTableData } from "./courseColumns";
import CourseCustimisation from "./singleCourseEdit";
import { Card } from "@/components/atoms/baseShadcn/card";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { CreateCourse } from "./createCourse";
import Popup from "@/components/atoms/utility/floatContainer";

interface DataTableProps<TData> {
  columns: (ColumnDef<TData, string> | ColumnDef<TData, moduleDTO[]>)[];
  data: TData[];
}

export function CourseTable<TData>({ columns, data }: DataTableProps<TData>) {
  const [showPopUp, setPopUp] = useState(false);
  const [showCreatePopup, setshowCreatePopUp] = useState(false);
  const [dataState, setData] = useState<CourseTableData>({
    course: { CourseID: "", CourseName: "", UniversityID: "" },
    modules: [],
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function callPopup(dataState: CourseTableData) {
    setPopUp(true);
    setData(dataState);
  }

  return (
    <>
      <div className="overflow-hidden rounded-md  justify-center">
        <ShadTable className="text-center w-3/4 mx-auto border rounded-2xl">
          <CourseHeaders table={table} />
          <CourseTableBody table={table} setPopUp={callPopup} />
        </ShadTable>
        <div className="w-full items-center flex justify-center mt-5">
          <Button onClick={() => setshowCreatePopUp(true)}>
            {" "}
            Create new course
          </Button>
        </div>
      </div>{" "}
      {showPopUp && (
        <Popup>
          <Card className="  w-4/10 justify-center flex flex-col items-center ">
            <div className="w-full items-center flex flex-col">
              <CourseCustimisation
                data={dataState.course}
              ></CourseCustimisation>
            </div>
            {dataState.modules.length == 0 ? (
              <div>There are no modules to customise </div>
            ) : (
              <CustomiseShell modules={dataState.modules} events={[]} />
            )}
            <Button onClick={() => setPopUp(false)}>close</Button>
          </Card>
        </Popup>
      )}
      {showCreatePopup && (
        <Popup>
          <Card className=" w-1/3 justify-center flex flex-col items-center space-y-4">
            <CreateCourse>
              <Button onClick={() => setshowCreatePopUp(false)}>close</Button>
            </CreateCourse>
          </Card>
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
  setPopUp: (dataState: CourseTableData) => void;
}) {
  const rows = table.getRowModel().rows;
  const empty = rows.length === 0;
  return (
    <tbody>
      {empty ? (
        <TableRow className="">
          <TableCell></TableCell>
          <TableCell>there are no rows to display</TableCell>
          <TableCell></TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                onClick={() => {
                  const original = row.original as CourseTableData;
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
