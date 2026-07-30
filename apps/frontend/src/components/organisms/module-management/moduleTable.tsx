import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Table as TanstackTable,
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
import EditModuleEvent from "./editModuleEvent";

interface DataTableProps<TData> {
  columns: (ColumnDef<TData, string> | ColumnDef<TData, EventResponse[]>)[];
  data: TData[];
}

export function ModuleTable<TData>({ columns, data }: DataTableProps<TData>) {
  "use no memo";

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [dataState, setDataState] = useState<ModuleTableData>({
    events: [],
    modules: { moduleCode: "", moduleID: "", moduleName: "" },
  });

  const [showModPopup, updateModPopup] = useState(false);

  function showUpdateMod(param: ModuleTableData) {
    updateModPopup(true);
    setDataState(param);
  }

  return (
    <>
      <Table>
        <CourseHeaders table={table} />
        <CourseTableBody table={table} setPopUp={showUpdateMod} />
      </Table>

      {showModPopup && (
        <Popup>
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <EditModuleEvent
              data={dataState}
              onClose={() => updateModPopup(false)}
            />
          </div>
        </Popup>
      )}
    </>
  );
}

function CourseHeaders<TData>({ table }: { table: TanstackTable<TData> }) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow
          key={headerGroup.id}
          className="border-b border-[var(--border)]"
        >
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className="p-4 text-[var(--text-primary)] font-bold"
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}

function CourseTableBody<TData>({
  table,
  setPopUp,
}: {
  table: TanstackTable<TData>;
  setPopUp: (dataState: ModuleTableData) => void;
}) {
  const rows = table.getRowModel().rows;
  const empty = rows.length === 0;

  return (
    <TableBody>
      {empty ? (
        <TableRow>
          <TableCell
            colSpan={3}
            className="p-8 text-center text-[var(--text-secondary)]"
          >
            No modules found matching your filters
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow
            id="row-module-row"
            key={row.id}
            className="border-b border-[var(--border)] brand-table-hover cursor-pointer"
          >
            {row.getVisibleCells().map((cell, index) => (
              <TableCell
                data-testid="modules-table-cell"
                key={cell.id}
                className={`p-4 ${index === 0 ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
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
    </TableBody>
  );
}
