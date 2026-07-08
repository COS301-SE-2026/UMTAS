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
      <div className="h-full w-full overflow-hidden rounded-md items-center flex flex-col ">
        <Card className="w-3/4 h-2/4">
          <ShadTable className="text-center w-full mx-auto overflow-scroll">
            <CourseHeaders table={table} />
            <CourseTableBody table={table} setPopUp={showUpdateMod} />
          </ShadTable>
        </Card>
      </div>

      {showModPopup && (
        <Popup>
          <Card className="items-center">
            <CustomiseShell
              modules={[dataState.modules]}
              events={dataState.events}
            />
            <Button className="w-1/10" onClick={() => updateModPopup(false)}>
              close
            </Button>
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
  setPopUp: (dataState: ModuleTableData) => void;
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
