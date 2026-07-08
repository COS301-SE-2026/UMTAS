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

interface DataTableProps<TData> {
  columns: (ColumnDef<TData, string> | ColumnDef<TData, moduleDTO[]>)[];
  data: TData[];
}

export function CourseTable<TData>({ columns, data }: DataTableProps<TData>) {
  const [showPopUp, setPopUp] = useState(false);
  const [modules, setModules] = useState<moduleDTO[]>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function callPopup(modules: moduleDTO[]) {
    setPopUp(true);
    setModules(modules);
  }

  return (
    <>
      <div className="overflow-hidden rounded-md flex justify-center">
        <ShadTable className="text-center w-3/4 mx-auto border rounded-2xl">
          <CourseHeaders table={table} />
          <CourseTableBody table={table} setPopUp={callPopup} />
        </ShadTable>
      </div>{" "}
      {showPopUp && (
        <div className="fixed w-full inset-0 flex items-center justify-center  bg-opacity-50 z-50">
          <div className="bg-black border-white  rounded-2xl border">
            <Button onClick={() => setPopUp(false)}>close</Button>
            <CustomiseShell modules={modules} events={[]} />
          </div>
        </div>
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
  setPopUp: (modules: moduleDTO[]) => void;
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
                  console.log(original.modules);
                  setPopUp(original.modules);
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
