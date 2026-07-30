"use client";

import { ModuleTable } from "@/components/organisms/module-management/moduleTable";
import dynamic from "next/dynamic";

//this is to prevent hydration issues by forcing it to not be server side
const ModManagementTemplate = dynamic(
  () =>
    import("@/components/templates/module-management/moduleManagementTemplate"),
  { ssr: false },
);

export default function ModuleManagement() {
  return <ModManagementTemplate />;
}
