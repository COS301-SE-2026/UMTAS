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
import { useRouter } from "next/navigation";

import Tutorial from "@/components/organisms/nav/Tutorial";
import NotFound from "@/app/not-found";

import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
const steps = [
  {
    target: "#btn-create-module-new",
    content: "Create a brand new module.",
  },
  {
    target: "#input-search-module-code",
    content: "Search for a module by code, name, or events.",
  },
  {
    target: "#select-module-prefixes",
    content: "Filter modules using code prefixes.",
  },
  {
    target: "#row-module-row",
    content: "Select a module to edit or create events for it.",
  },
];

export default function ModManagementTemplate() {
  const [showCreateModule, updateShowModule] = useState(false);
  const [enrolledQ, setEnrolledQ] = useState<boolean>(false);
  const { data: modData } = useQuery({
    queryKey: [
      "Modules",
      UserDetails.getUniDetails()?.UniversityID ?? "",
      enrolledQ ?? false,
    ],
    queryFn: async () => {
      const result = await fetchAllModulesv2({
        universityId: UserDetails.getUniDetails()?.UniversityID,
        userEnrollment: enrolledQ,
      });
      return result.modules;
    },
  });
  const data = useMemo(
    () =>
      modData?.map((module) => ({
        modules: module,
        events: module.Events ?? [],
      })) ?? [],
    [modData],
  );
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
        events?.some(
          (event) =>
            event.eventName?.toLowerCase().includes(searchLowercase) ||
            event.activityCode?.toLowerCase().includes(searchLowercase),
        );

      return modulesMatch && matchesSearch;
    });
  }, [data, foundPrefixForModule, searchQuery]);

  const UniDetails = UserDetails.getUniDetails();
  const ViableRole =
    UniDetails?.role === "UNIVERSITY_ADMIN" ||
    UniDetails?.role === "LECTURER" ||
    UniDetails?.role === "STUDENT";
  const router = useRouter();

  // if (UniDetails === null) {
  //   router.push("/dashboard");
  // }

  const hasRole = UniDetails?.role != null;
  if (!hasRole) return <NoRoleSelected />;

  if (!ViableRole) {
    return <NotFound />;
  }

  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6 pt-6">
      <Tutorial steps={steps} wait={true} />

      <div className="w-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Module Management
        </h1>
        <p className="text-sm text-[var(--text-secondary)] pl-4 pt-2 pb-2">
          Search and filter modules and their events.
        </p>

        {/* <Button
          id="btn-create-module-new"
          onClick={() => updateShowModule(true)}
          className="ml-4 mt-2"
        >
          Create Module
        </Button> */}

        <div className="flex flex-col md:flex-row gap-4 p-5 border-b border-[var(--border)] items-center justify-between bg-[var(--bg-surface)]">
          <div className="w-full md:max-w-sm flex-1">
            <Input
              id="input-search-module-code"
              placeholder="Search module code, name or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)]"
            />
          </div>
          <div className="  flex items-center text-left gap-x-4 flex-row  bg-[var(--background)] px-2 p-1 rounded-xl ">
            <label className="focus:text-accent-foreground ">
              Show only enrolled modules
            </label>
            <Checkbox
              checked={enrolledQ}
              onCheckedChange={(checked: boolean) => setEnrolledQ(checked)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
              <SelectTrigger
                id="select-module-prefixes"
                className="w-[180px] bg-[var(--background)]"
              >
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

        <ModuleTable columns={moduleCols} data={filteredModules} />
      </div>

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
