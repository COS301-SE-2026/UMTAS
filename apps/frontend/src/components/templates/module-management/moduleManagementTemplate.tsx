"use client";
import { getAllModCoursesQ } from "@/app/course-management/queries/modules/moduleQueries";
import {
  moduleCols,
  ModuleTableData,
} from "@/components/organisms/module-management/ModuleColumns";
import { useQueries, useQuery } from "@tanstack/react-query";

import { UserDetails } from "@/lib/userclass/userClass";
import { ModuleTable } from "@/components/organisms/module-management/moduleTable";
import { getAllEventsAdminQ } from "@/app/module-management/queries/queries";
import { Card } from "@/components/atoms/baseShadcn/card";
import { useState } from "react";
import CreateModuleAdmin from "@/components/organisms/module-management/addModule";
import Popup from "@/components/atoms/utility/floatContainer";
import { Button } from "@/components/atoms/baseShadcn/button";

// this will do the actual request for modules and filtering, table is static data except for updates
export default function ModManagementTemplate() {
  const [showCreateModule, updateShowModule] = useState(false);
  const { data: modData } = useQuery(
    getAllModCoursesQ({
      universityId: UserDetails.getUniDetails()?.UniversityID,
    }),
  );
  const eventQueries = useQueries({
    queries: (modData ?? []).map((mod) => ({
      ...getAllEventsAdminQ(mod.moduleID),
      enabled: !!mod.moduleID,
    })),
  });

  const data: ModuleTableData[] =
    modData?.map((mod, idx) => ({
      modules: mod,
      events: eventQueries[idx].data ?? [],
    })) ?? [];

  return (
    <div className="h-[80vh] items-center flex flex-col justify-around">
      <Card className="h-1/4 w-1/2 mb-5 text-center">filters go here</Card>
      <ModuleTable columns={moduleCols} data={data} />
      <Button
        onClick={() => {
          updateShowModule(true);
        }}
      >
        Create Module
      </Button>
      {showCreateModule && (
        <Popup>
          <div className="flex flex-col items-center w-1/3 space-y-5">
            <CreateModuleAdmin>
              <Button
                onClick={() => {
                  updateShowModule(false);
                }}
              >
                Close
              </Button>
            </CreateModuleAdmin>
          </div>
        </Popup>
      )}
    </div>
  );
}
