"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import { LucidePlusCircle } from "lucide-react";
import { useState } from "react";
import PreferenceSection from "@/components/molecules/solver/PreferencesCard";
import { useRouter } from "next/navigation";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import {
  createSolverJobBuilder,
  enrollModBuilder,
  pollSolverOutputBuilder,
} from "@/app/solver/queries/Solver/builder";
import { createTimeTableBuilder } from "@/app/builder/utils/timetables/TimeTableRequests";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";

export type SolverResult = {
  engine: "cp-sat" | (string & {});
  outcome: "conflict-free" | "has-conflicts" | (string & {});
  metadata: {
    conflicts: unknown[];
    solveMode: "feasibility" | "optimization" | (string & {});
    conflictCount: number;
  };
  heuristicScores: unknown[];
  timetableSolution: {
    selectedEventIds: string[];
  };
};
type solverProps = {
  modules: ModuleResponseDto[];
  events: EventResponse[];
};

export default function SolverPreferences({ modules, events }: solverProps) {
  const [iconClicked, setIconClicked] = useState(false);
  const [sections, setSections] = useState([0]);
  const [currentMode, setCurrentMode] = useState<
    "feasibility" | "optimization"
  >("feasibility");
  const [jobID, setJobID] = useState<string | null>(null);
  const [jobFailed, setJobFailed] = useState<boolean>(false);

  const { data: resultOfPoll, isFetching: pollFetching } = useQuery({
    queryKey: ["solver", "poll"],
    queryFn: async () => {
      const pollBuilder = new pollSolverOutputBuilder();
      const resultOfPoll = await pollBuilder.send({
        paths: {
          jobId: jobID || "",
        },
      });
      console.log("Polled", resultOfPoll);
      return resultOfPoll;
    },
    enabled: jobID != null && jobID != "",
    refetchInterval: 2500,
  });

  const enrollUserMutation = useMutation({
    mutationFn: async () => {
      const builder = new enrollModBuilder();
      return await Promise.allSettled(
        modules.map(async (mod) => {
          const result = await builder.send({
            paths: {
              moduleId: mod.moduleID,
            },
          });
          return result;
        }),
      );
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async () => {
      const builder = new createSolverJobBuilder();
      return await builder.send({
        body: {
          engine: currentMode === "feasibility" ? "cp-sat" : "ga",
          solveMode: currentMode,
          solverProfileKey: "default",
        },
      });
    },
  });

  const createTimeTableMutation = useMutation({
    mutationFn: async () => {
      if (resultOfPoll) {
        const typeShiftedResults = resultOfPoll.result as SolverResult;
        console.log("Poll closed result finished", resultOfPoll.result);
        const timetableBuilder = new createTimeTableBuilder();
        const resultTT = await timetableBuilder.send({
          body: {
            eventIds: typeShiftedResults.timetableSolution.selectedEventIds,
            timetableName: new Date().toLocaleString(),
          },
        });
        return resultTT;
      }
    },
  });

  async function enrollUser() {
    enrollUserMutation.mutate();
    await solveForUsersModules();
  }
  async function solveForUsersModules() {
    // uses enrolled modules to create a solved output

    const result = await createJobMutation.mutateAsync();
    if (result) {
      setJobID(result.jobId || "");
    }
  }
  function handleStatus() {
    if (resultOfPoll) {
      if (resultOfPoll.status === "completed") {
        createTimeTableMutation.mutate();
      }
      if (resultOfPoll.status === "failed" && jobID != null) {
        setJobID(null);
      }
    }
  }

  handleStatus();
  const router = useRouter();

  function handleAdd() {
    setSections((prev) => [...prev, Date.now()]);
  }

  function handleDelete(idToDelete: number) {
    setSections((prev) => prev.filter((id) => id !== idToDelete));
  }

  function solveMode(mode: string) {
    if (mode === "feasibility") {
      return <></>;
    }

    return (
      <>
        {" "}
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <strong>Preferences</strong>
            <LucidePlusCircle
              strokeWidth={iconClicked ? 1.8 : 1.1}
              onClick={() => {
                handleAdd();
                setIconClicked(true);
                setTimeout(() => setIconClicked(false), 150);
              }}
              className="transition-all duration-150 cursor-pointer"
            />
          </div>
          {sections.map((id) => (
            <PreferenceSection
              key={id}
              DropdownItems={[
                "Prefer mornings",
                "Prefer evenings",
                "Prefer large gaps",
              ]}
              onDelete={() => {
                handleDelete(id);
              }}
            />
          ))}
        </div>
      </>
    );
  }
  function loadingStatus() {
    return (
      enrollUserMutation.isPending ||
      createJobMutation.isPending ||
      pollFetching ||
      createTimeTableMutation.isPending ||
      resultOfPoll?.status === "queued"
    );
  }
  function dynamicSpinner() {
    let spinnerText = "";

    if (resultOfPoll !== null && resultOfPoll?.status === "queued") {
      if (enrollUserMutation.isPending) {
        spinnerText = "Setting things up...";
      } else if (createJobMutation.isPending) {
        spinnerText = "Creating Job";
      } else if (pollFetching) {
        spinnerText = "Solving...";
      } else if (createTimeTableMutation.isPending) {
        spinnerText = "Creating timetable";
      } else if (resultOfPoll.status === "queued") {
        spinnerText = "Solving...";
      }

      return (
        <div>
          {spinnerText}
          <Spinner />
        </div>
      );
    } else {
      return <></>;
    }
  }

  return (
    <>
      <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)] w-md">
        <CardHeader className="text-xl font-bold text-[var(--text-primary)]">
          Set your preferences
        </CardHeader>
        <CardDescription className="px-4">
          These are soft preferences. They shape which timetable is picked,
          never making a timetable invalid
        </CardDescription>

        <CardContent className="space-y-4">
          {!loadingStatus() ? (
            <>
              <div className="space-y-2">
                <strong>
                  <p>Solve mode</p>
                </strong>
                <div className="flex flex-row gap-4">
                  {" "}
                  <Button
                    disabled={loadingStatus()}
                    variant={"outline"}
                    onClick={() => {
                      setCurrentMode("feasibility");
                    }}
                  >
                    Feasibility
                  </Button>
                  <Button
                    disabled={loadingStatus()}
                    variant={"outline"}
                    onClick={() => {
                      setCurrentMode("optimization");
                    }}
                  >
                    Optimisation
                  </Button>
                </div>
              </div>
              {solveMode(currentMode)}
              <Button
                disabled={loadingStatus()}
                type="button"
                onClick={enrollUser}
              >
                upload and create timetable
              </Button>
              <Button
                disabled={loadingStatus()}
                type="button"
                onClick={() => {
                  router.push("/schedules");
                }}
              >
                View Timetable
              </Button>
            </>
          ) : (
            <>{dynamicSpinner()}</>
          )}
        </CardContent>
      </Card>
    </>
  );
}
