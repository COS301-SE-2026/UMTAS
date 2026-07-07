import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  Table,
  useReactTable,
} from "@tanstack/react-table";

interface DataTableProps<TData> {
  columns: (ColumnDef<TData, string> | ColumnDef<TData, moduleDTO[]>)[];
  data: TData[];
}

export function CourseTable<TData>({ columns, data }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <CourseHeaders table={table} />
      <CourseTableBody table={table} />
    </table>
  );
}

function CourseHeaders<TData>({ table }: { table: Table<TData> }) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}

function CourseTableBody<TData>({ table }: { table: Table<TData> }) {
  const rows = table.getRowModel().rows;
  const empty = rows.length === 0;
  return (
    <tbody>{empty ? <NoRows /> : <CourseTableBodyFull rows={rows} />}</tbody>
  );
}

function NoRows() {
  return (
    <tr>
      <td>there are no rows to display</td>
    </tr>
  );
}

export function CourseTableBodyFull<TData>({ rows }: { rows: Row<TData>[] }) {
  return rows.map((row) => (
    <tr key={row.id}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  ));
}
