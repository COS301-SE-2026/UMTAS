"use client";

import { ColumnDef } from "@tanstack/react-table";

export type user = {
  name: string;
  email: string;
  role: "Student" | "Lecturer" | "Uni Admin";
};

export const columns: ColumnDef<user>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];
