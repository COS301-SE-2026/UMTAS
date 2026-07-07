import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import {
  Table as ShadTable,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";
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
    <div className="overflow-hidden rounded-md flex justify-center">
      <ShadTable className="text-center w-3/4 mx-auto border rounded-2xl">
        <CourseHeaders table={table} />
        <CourseTableBody table={table} />
      </ShadTable>
    </div>
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

function CourseTableBody<TData>({ table }: { table: Table<TData> }) {
  const rows = table.getRowModel().rows;
  const empty = rows.length === 0;
  return (
    <tbody>{empty ? <NoRows /> : <CourseTableBodyFull rows={rows} />}</tbody>
  );
}

function NoRows() {
  return (
    <TableRow className="">
      <TableCell></TableCell>
      <TableCell>there are no rows to display</TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
}

export function CourseTableBodyFull<TData>({ rows }: { rows: Row<TData>[] }) {
  return rows.map((row) => (
    <TableRow key={row.id}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  ));
}
