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
import { useMemo } from "react";
import { Input } from "@/components/atoms/baseShadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

// this will do the actual request for modules and filtering, table is static data except for updates
export default function ModManagementTemplate() {
  const [showCreateModule, updateShowModule] = useState(false);
  const { data: modData } = useQuery(
    getAllModCoursesQ({
      universityId: UserDetails.getUniDetails()?.UniversityID,
    }),
  );
  const eventQueries = useQueries({
    queries: (modData ?? []).map((module) => ({
      ...getAllEventsAdminQ(module.moduleID),
      enabled: !!module.moduleID,
    })),
  });

  const data: ModuleTableData[] =
    modData?.map((module, idx) => ({
      modules: module,
      events: eventQueries[idx].data ?? [],
    })) ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState("All");

  const modulePrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    modData?.forEach((module) => {
      if (module.moduleCode) {
        const match = module.moduleCode.match(/^[A-Za-z]+/);
        if (match) {
          prefixes.add(match[0].toUpperCase());
        }
      }
    });
    return Array.from(prefixes).sort();
  }, [modData]);

  const foundPrefixForModule =
    selectedPrefix !== "All" && !modulePrefixes.includes(selectedPrefix)
      ? "All"
      : selectedPrefix;

  const filteredModules = useMemo(() => {
    return data.filter(({ modules: module, events }) => {
      const modulesMatch =
        foundPrefixForModule === "All" ||
        (module.moduleCode &&
          module.moduleCode.toUpperCase().startsWith(foundPrefixForModule));

      const searchLowercase = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        module.moduleCode?.toLowerCase().includes(searchLowercase) ||
        module.moduleName?.toLowerCase().includes(searchLowercase) ||
        events.some(
          (event) =>
            event.eventName?.toLowerCase().includes(searchLowercase) ||
            event.activityCode?.toLowerCase().includes(searchLowercase),
        );

      return modulesMatch && matchesSearch;
    });
  }, [data, foundPrefixForModule, searchQuery]);

  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6 pt-6">
      <Card className="flex flex-col w-full max-w-6xl border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm overflow-hidden h-full">
        <div className="flex flex-col flex-row justify-between items-start items-center pr-5 bg-[var(--bg-surface)]">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-5 pt-5">
              Module Management
            </h1>
            <p className="text-sm text-[var(--text-secondary)] pl-5 pt-2 pb-5">
              Search and filter modules and their events.
            </p>
          </div>
          <Button onClick={() => updateShowModule(true)} className="mt-4">
            Create Module
          </Button>
        </div>
        <div className="flex flex-col flex-row gap-4 p-5 items-center justify-between bg-[var(--bg-surface)]">
          <div className="w-full max-w-sm flex-1">
            <Input
              placeholder="Search module code, name, or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
              <SelectTrigger className="w-[180px] bg-[var(--background)]">
                <SelectValue placeholder="Filter Prefix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Prefixes</SelectItem>
                {modulePrefixes.map((prefix) => (
                  <SelectItem key={prefix} value={prefix}>
                    {prefix}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[var(--bg-surface)]">
          <ModuleTable columns={moduleCols} data={filteredModules} />
        </div>
      </Card>
      {showCreateModule && (
        <Popup>
          <div className="flex flex-col items-center w-full max-w-5xl space-y-5">
            <CreateModuleAdmin>
              <Button
                variant="outline"
                className="border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)]"
                onClick={() => updateShowModule(false)}
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
