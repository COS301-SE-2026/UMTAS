import { ColumnDef } from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function CourseTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  return <></>;
}
