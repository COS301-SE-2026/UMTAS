"use client";
import { getAllModCoursesQ } from "@/app/course-management/queries/modules/moduleQueries";
import {
  moduleCols,
  ModuleTableData,
} from "@/components/organisms/module-management/ModuleColumns";
import { useQuery } from "@tanstack/react-query";
import { getAllEventsQ } from "../builder/Queries/eventQueries";
import { UserDetails } from "@/lib/userclass/userClass";
import { ModuleTable } from "@/components/organisms/module-management/moduleTable";

// this will do the actual request for modules and filtering, table is static data except for updates
export default function ModManagementTemplate() {
  const { data: modData } = useQuery(
    getAllModCoursesQ({
      universityId: UserDetails.getUniDetails()?.UniversityID,
    }),
  );
  const { data: eventData } = useQuery(getAllEventsQ());
  const data: ModuleTableData[] =
    modData?.map((mod) => ({
      modules: mod,
      events:
        eventData?.filter(
          (event) => event.eventCriteria.moduleID === mod.moduleID,
        ) ?? [],
    })) ?? [];

  return <ModuleTable columns={moduleCols} data={data} />;
}
