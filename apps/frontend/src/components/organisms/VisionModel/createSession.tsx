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
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";
import { useState } from "react";
import { toast } from "sonner";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  createSessionMut,
  deleteSessionMut,
  getAllSessionQuery,
  sessionDTO,
} from "../../../../utilities/VisionModel/backend/persistance";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";

export interface CreateSessionProps {
  updateSessionID: (id: string) => void;
}

export default function CreateVmSession({
  updateSessionID,
}: CreateSessionProps) {
  const { data: allModules = [] } = useQuery({
    queryKey: ["Modules"],
    queryFn: async () => {
      const result = await fetchAllModulesv2({
        universityId: UserDetails.getUniDetails()?.UniversityID,
      });
      return result.modules;
    },
  });

  const [filterText, setFilterText] = useState<string>("");
  const [SessionfilterText, setSessionFilterText] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sessionName, setSessionName] = useState<string>("");
  const [sessionDsc, setSessionDsc] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<sessionDTO | null>(
    null,
  );

  const [selectedModule, setSelectedModule] = useState<moduleDTO | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null,
  );

  const { data: allSessions = [], isLoading: sessionsLoading } = useQuery(
    getAllSessionQuery({}),
  );

  function verifyDetails() {
    if (selectedDate == "") return false;
    if (selectedModule == null || selectedModule.moduleID == undefined)
      return false;
    if (selectedEvent == null || selectedEvent.eventId == undefined)
      return false;
    if (sessionName == "") return false;

    const foundSession = allSessions.find((sesh) => {
      return sesh.Date == selectedDate && sesh.SessionName == sessionName;
    });
    if (foundSession) {
      toast.error("Session already exists", {
        description: "Choose a different session name or date.",
      });
      return false;
    }

    return true;
  }

  const {
    mutateAsync: createSessionFunction,
    isPending: createSessionPending,
  } = useMutation(createSessionMut());

  const { mutateAsync: deleteSessionFunction, isPending: deleteIsPending } =
    useMutation(deleteSessionMut());

  function filterSession(filter: string) {
    const lowerQuery = filter.toLowerCase();

    return allSessions.filter((sesh) => {
      const nameMatch = sesh.SessionName.toLowerCase().includes(lowerQuery);
      const codeMatch =
        sesh.SessionDsc?.toLowerCase().includes(lowerQuery) ?? false;

      return nameMatch || codeMatch;
    });
  }

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
          toast.error("Invalid session date", {
            description: `This event runs on ${requiredDay}. Choose a ${requiredDay}.`,
          });
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
  function findSetSession(seshID: string) {
    const sesh = allSessions.find((sesh) => sesh.SessionID === seshID);
    if (sesh) setSelectedSession(sesh);
  }

  function findSetModule(modID: string) {
    const universityModule = allModules.find((mod) => mod.moduleID === modID);

    if (universityModule) {
      setSelectedModule(universityModule);
      setSelectedEvent(null);
      setSelectedDate("");
    }
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
      setSelectedEvent(uniEvent);

      if (uniEvent.eventCriteria.date) {
        setSelectedDate(uniEvent.eventCriteria.date);
      } else {
        setSelectedDate("");
      }
    }
  }

  return (
    <Card className="w-[min(90vw,960px)] max-h-[85vh] overflow-auto border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="space-y-1 border-b border-[var(--border)]">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Choose a Lecture Watch session
        </CardTitle>
        <CardDescription className="text-sm text-[var(--text-secondary)]">
          Select an existing session or create a new one to save Lecture Watch
          results.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-4">
        <section
          aria-label="Use existing session"
          className="space-y-4 rounded-lg border border-[var(--border)] p-4"
        >
          <div>
            <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
              Use existing session
            </h2>
            <p className="mt-1 text-xs leading-[1.5] text-[var(--text-secondary)]">
              Continue analysing an existing session and save new results to it.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Filter sessions
              </Label>
              <Input
                type="text"
                placeholder="Search sessions..."
                value={SessionfilterText}
                onChange={(e) => setSessionFilterText(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Select session
              </Label>
              <Select
                disabled={sessionsLoading || allSessions.length == 0}
                value={selectedSession?.SessionID}
                onValueChange={(v) => findSetSession(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      sessionsLoading
                        ? "Loading sessions..."
                        : "Select a session"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                  {filterSession(SessionfilterText).map((sesh) => {
                    const label = `${sesh.SessionName} : ${sesh.Date} `;

                    return (
                      <SelectItem
                        key={sesh.SessionID}
                        value={String(sesh.SessionID)}
                        className="text-sm text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
                      >
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2 gap-x-3">
            <Button
              disabled={selectedSession?.SessionID == null || deleteIsPending}
              type="button"
              variant="outline"
              className=""
              onClick={async () => {
                if (!selectedSession?.SessionID) return;

                const sessionNameToDelete = selectedSession.SessionName;

                try {
                  await deleteSessionFunction({
                    path: {
                      sessionId: selectedSession.SessionID,
                    },
                  });

                  setSelectedSession(null);

                  toast.success("Session deleted", {
                    description: `${sessionNameToDelete} was removed.`,
                  });
                } catch (error) {
                  console.error("Could not delete session:", error);

                  toast.error("Session could not be deleted", {
                    description: "Please try again.",
                  });
                }
              }}
            >
              {!deleteIsPending ? (
                <>Delete Session</>
              ) : (
                <>
                  <Spinner />
                </>
              )}
            </Button>
            <Button
              disabled={selectedSession?.SessionID == null}
              type="button"
              variant="outline"
              className=""
              onClick={() => {
                if (!selectedSession?.SessionID) return;

                updateSessionID(selectedSession.SessionID);

                toast.success("Session selected", {
                  description: `${selectedSession.SessionName} is ready for analysis.`,
                });
              }}
            >
              Use Session
            </Button>
          </div>
        </section>

        <section
          aria-label="Create a new session"
          className="space-y-4 rounded-lg border border-[var(--border)] p-4"
        >
          <div>
            <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
              Create a new session
            </h2>
            <p className="mt-1 text-xs leading-[1.5] text-[var(--text-secondary)]">
              Choose the class this analysis belongs to, then give the session a
              name.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Filter modules
              </Label>
              <Input
                type="text"
                placeholder="Filter modules..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Select module
              </Label>
              <Select
                value={String(selectedModule?.moduleID ?? "")}
                onValueChange={(v) => findSetModule(v)}
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Select event
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
                onValueChange={(v) => findSetEvent(v)}
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Session date
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Session name
              </Label>
              <Input
                type="text"
                placeholder="e.g. Monday Lecture"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--text-primary)]">
                Description
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

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (!verifyDetails()) return;

                try {
                  const result = await createSessionFunction({
                    Date: selectedDate,
                    ModuleID: selectedModule?.moduleID ?? "",
                    EventID: selectedEvent?.eventId,
                    SessionName: sessionName.trim(),
                    SessionDsc:
                      sessionDsc.trim() === "" ? undefined : sessionDsc.trim(),
                    Data: {
                      questions_asked: 0,
                      total_frames: 0,
                      total_no_attention: 0,
                      total_paying_attention: 0,
                      total_restless_frames: 0,
                      total_stable_frames: 0,
                    },
                  });

                  if (result.session) {
                    updateSessionID(result.session.SessionID);

                    toast.success("Session created", {
                      description: `${sessionName.trim()} is ready for analysis.`,
                    });
                  }
                } catch (error) {
                  console.error("Could not create session:", error);

                  toast.error("Session could not be created", {
                    description: "Check the details and try again.",
                  });
                }
              }}
              type="button"
              disabled={
                selectedDate == "" ||
                sessionName == "" ||
                selectedEvent == null ||
                selectedModule == null
              }
              className="w-full sm:w-auto"
            >
              {!createSessionPending ? (
                <>Create Session</>
              ) : (
                <>
                  <Spinner />
                </>
              )}
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
