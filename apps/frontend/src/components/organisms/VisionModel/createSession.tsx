import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/atoms/baseShadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";
import { useQuery } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";
import { useState } from "react";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";

export default function CreateVmSession() {
  const { data: allModules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ["Modules"],
    queryFn: async () => {
      const result = await fetchAllModulesv2({
        universityId: UserDetails.getUniDetails()?.UniversityID,
      });
      return result.modules;
    },
  });
  const [filterText, setFilterText] = useState<string>("");

  function filterModules(query: string) {
    const lowerQuery = query.toLowerCase();

    return allModules.filter((m) => {
      const nameMatch = m.moduleName.toLowerCase().includes(lowerQuery);
      const codeMatch =
        m.moduleCode?.toLowerCase().includes(lowerQuery) ?? false;

      return nameMatch || codeMatch;
    });
  }

  const [selectedModule, setSelectedModule] = useState<moduleDTO | null>(null);

  function findSetModule(modID: string) {
    const UniModule = allModules.find((mod) => mod.moduleID === modID);

    if (UniModule) setSelectedModule(UniModule);
  }
  return (
    <Card className="w-[min(90vw,960px)] h-[85vh] overflow-auto border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="space-y-1 border-b border-[var(--border)]">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Create or update a session
        </CardTitle>

        <CardDescription className="text-sm text-[var(--text-secondary)]">
          A session will hold everything captured from a video or live session
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Filter Modules
            </Label>
            <Input
              type="text"
              placeholder="Filter modules..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-80 max-w-100 bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Select Module
            </Label>

            <Select
              value={String(selectedModule?.moduleID ?? "")}
              onValueChange={(v) => {
                findSetModule(v);
              }}
            >
              <SelectTrigger
                data-testid="event-Module-Select"
                className="w-80 max-w-100"
              >
                <SelectValue placeholder="Select a Module" />
              </SelectTrigger>

              <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                {filterModules(filterText).map((m) => {
                  let label = m.moduleName;
                  if (m.moduleCode) {
                    label = `${m.moduleCode} - ${m.moduleName}`;
                  }

                  return (
                    <SelectItem
                      key={m.moduleID}
                      value={String(m.moduleID)}
                      className="text-sm text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
                    >
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedModule &&
            (selectedModule.Events?.length != 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[var(--text-primary)]">
                  Select Event Type
                </Label>
                <Select
                  value={String(selectedModule?.moduleID ?? "")}
                  onValueChange={(v) => {
                    findSetModule(v);
                  }}
                >
                  <SelectTrigger
                    data-testid="event-Module-Select"
                    className="w-80 max-w-100"
                  >
                    <SelectValue placeholder="Select an event type" />
                  </SelectTrigger>

                  <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] capitalize">
                    {selectedModule?.Events?.map((event) => {
                      if (event.activityCode) {
                        const label =
                          event.activityCode +
                          " " +
                          (event.isRecurring
                            ? event.eventCriteria.dayOfWeek
                            : event.eventCriteria.date);
                        return (
                          <SelectItem
                            key={label}
                            value={String(event.activityCode)}
                            className="text-sm text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
                          >
                            {label}
                          </SelectItem>
                        );
                      }
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm   font-medium text-[var(--text-primary)]">
                  This module has no events yet please select one with events
                </Label>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
