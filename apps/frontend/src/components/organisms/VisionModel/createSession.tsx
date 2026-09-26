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
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { useErrorListener } from "@/hooks/errorListener";
import { errorName } from "../../../../utilities/errorCries";
import { Button } from "@/components/atoms/baseShadcn/button";

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
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sessionName, setSessionName] = useState<string>("");
  const [sessionDsc, setSessionDsc] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<moduleDTO | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );

  useErrorListener();
  const DAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  function setDate(date: string) {
    if (!date) return;

    if (selectedEvent) {
      if (selectedEvent.eventCriteria.date) {
        setSelectedDate(selectedEvent.eventCriteria.date);
      } else if (
        selectedEvent.isRecurring &&
        selectedEvent.eventCriteria.dayOfWeek
      ) {
        const requiredDay = selectedEvent.eventCriteria.dayOfWeek.toLowerCase();
        const targetIndex = DAYS.indexOf(requiredDay);

        if (new Date(date).getDay() === targetIndex) {
          setSelectedDate(date);
        } else {
          window.dispatchEvent(
            new CustomEvent(errorName, {
              detail: {
                userMessage: `Please ensure a date is selected on a ${requiredDay}`,
              },
            }),
          );
        }
      }
    }
  }

  function filterModules(query: string) {
    const lowerQuery = query.toLowerCase();

    return allModules.filter((m) => {
      const nameMatch = m.moduleName.toLowerCase().includes(lowerQuery);
      const codeMatch =
        m.moduleCode?.toLowerCase().includes(lowerQuery) ?? false;

      return (nameMatch || codeMatch) && m.Events && m.Events?.length > 0;
    });
  }

  function findSetModule(modID: string) {
    const UniModule = allModules.find((mod) => mod.moduleID === modID);

    if (UniModule) setSelectedModule(UniModule);
  }

  function findSetEvent(key: string) {
    const uniEvent = selectedModule?.Events?.find((event) => {
      const eventKey =
        event.activityCode +
        " " +
        (event.isRecurring
          ? event.eventCriteria.dayOfWeek
          : event.eventCriteria.date);

      return eventKey === key;
    });

    if (uniEvent) {
      if (uniEvent.eventCriteria.date) {
        setDate(uniEvent.eventCriteria.date);
      }
      setSelectedEvent(uniEvent);
    }
  }

  return (
    <Card className=" sm:max-w-1/3 w-[min(95vw,960px)] h-[85vh] overflow-auto border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="space-y-1 border-b border-[var(--border)]">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Create or update a session
        </CardTitle>

        <CardDescription className="text-sm text-[var(--text-secondary)]">
          A session will hold everything captured from a video or live session
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-3 flex flex-col items-center  w-full h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl justify-items-center">
          <h2 className="col-span-1 md:col-span-2 text-[15px] font-medium leading-[1.4] text-[var(--text-primary)] justify-self-start">
            Re-capture session
          </h2>

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Filter Session
            </Label>
            <Input
              type="text"
              placeholder="Filter Sessions..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Select Session
            </Label>
            <Select
              value={String(selectedModule?.moduleID ?? "")}
              onValueChange={(v) => {
                findSetModule(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>

              <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                {[].map((m) => {
                  return (
                    <SelectItem
                      key={m}
                      value={String(m)}
                      className="text-sm text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
                    >
                      {"text"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full max-w-sm md:col-span-2 flex justify-center">
            <Button className="w-full md:w-50">Re-capture Session</Button>
          </div>
        </div>

        <div className="h-[2px] w-full bg-[var(--border)] my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl justify-items-center">
          <h2 className="col-span-1 md:col-span-2 text-[15px] font-medium leading-[1.4] text-[var(--text-primary)] justify-self-start">
            Create new session
          </h2>

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Filter Modules
            </Label>
            <Input
              type="text"
              placeholder="Filter modules..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Select Module
            </Label>

            <Select
              value={String(selectedModule?.moduleID ?? "")}
              onValueChange={(v) => {
                findSetModule(v);
              }}
            >
              <SelectTrigger className="w-full">
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

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Select Event Type
            </Label>
            <Select
              disabled={selectedModule == null}
              value={
                selectedEvent && selectedEvent.activityCode
                  ? selectedEvent.activityCode +
                    " " +
                    (selectedEvent.isRecurring
                      ? selectedEvent.eventCriteria.dayOfWeek
                      : selectedEvent.eventCriteria.date)
                  : ""
              }
              onValueChange={(v) => {
                findSetEvent(v);
              }}
            >
              <SelectTrigger className="w-full">
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
                        value={label}
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

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Select Date
            </Label>
            <Input
              type="date"
              disabled={
                selectedEvent == null ||
                selectedEvent.eventCriteria.date != null
              }
              value={selectedDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Name Session
            </Label>
            <Input
              type="text"
              placeholder="name your session"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Describe Session
            </Label>
            <Input
              type="text"
              placeholder="Describe your session"
              value={sessionDsc}
              onChange={(e) => setSessionDsc(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div className="space-y-2 w-full max-w-sm flex justify-center p-2 mb-2">
          <Button
            disabled={
              selectedDate == "" || sessionName == "" || selectedEvent == null
            }
            className="w-full md:w-50"
          >
            Create Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
