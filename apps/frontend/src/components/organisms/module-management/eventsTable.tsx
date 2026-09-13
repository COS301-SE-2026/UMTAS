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
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, string>[];
  data: TData[];
  onRowClick: (event: EventResponse) => void;
}

export function EventsTable<TData>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData>) {
  "use no memo";

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [showModPopup, updateModPopup] = useState(false);

  return (
    <>
      <Table>
        <CourseHeaders table={table} />
        <CourseTableBody table={table} setPopUp={onRowClick} />
      </Table>

      {/* {showModPopup && (
        <Popup>
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <EditModuleEvent
              data={dataState}
              onClose={() => updateModPopup(false)}
            />
          </div>
        </Popup>
      )} */}
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
  setPopUp: (dataState: EventResponse) => void;
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
                  const original = row.original as EventResponse;
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
