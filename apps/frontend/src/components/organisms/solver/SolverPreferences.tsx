"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import { LucidePlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
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
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { Tienne } from "next/font/google";
import { Input } from "@/components/atoms/baseShadcn/input";

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
  const [timeValue, setTimevalue] = useState<number[]>([0]);
  const [jobID, setJobID] = useState<string | null>(null);
  const [jobFailed, setJobFailed] = useState<boolean>(false);
  const [timetableCreated, setTimetableCreated] = useState<boolean>(false);
  const router = useRouter();
  const [timetableName, setTimetableName] = useState<string>("");

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
      const eventIDS = events.map((event) => event.eventId);
      return await builder.send({
        body: {
          engine: "auto",
          solveMode: currentMode,
          eventIds: eventIDS,
        },
      });
    },
  });

  const createTimeTableMutation = useMutation({
    mutationFn: async () => {
      if (resultOfPoll && timetableCreated === false && !pollFetching) {
        setTimetableCreated(true);
        const typeShiftedResults = resultOfPoll.result;
        console.log("Poll closed result finished", resultOfPoll.result);
        const timetableBuilder = new createTimeTableBuilder();
        const resultTT = await timetableBuilder.send({
          body: {
            eventIds: typeShiftedResults?.timetableSolution.selectedEventIds,
            timetableName: timetableName == "" ? "My timetable" : timetableName,
          },
        });
        return resultTT;
      }
    },
    onError: () => {
      console.error("failed to make timetable");
    },
  });

  async function enrollUser() {
    setTimetableCreated(false);
    await enrollUserMutation.mutateAsync();
    solveForUsersModules();
  }

  async function solveForUsersModules() {
    // uses enrolled modules to create a solved output

    const result = await createJobMutation.mutateAsync();
    if (result) {
      console.log("New result for solve for users", result);
      setJobID(result.jobId || "");
    }
  }
  async function handleStatus() {
    if (resultOfPoll != null) {
      if (
        resultOfPoll.status === "completed" &&
        timetableCreated === false &&
        !createTimeTableMutation.isPending
      ) {
        const result = await createTimeTableMutation.mutateAsync();
        setJobID(null);
        getQueryClient().setQueryData(["solver", "poll"], null);
        if (timetableCreated === false)
          alert(
            `Timetable successfully created ${await result?.timetable.timetableName}`,
          );
      }
      if (resultOfPoll.status === "failed" && jobFailed === false) {
        console.log("set job to failed");
        setJobFailed(true);
      }
    }
  }

  handleStatus();

  function handleAdd() {
    setSections((prev) => [...prev, Date.now()]);
  }

  function handleDelete(idToDelete: number) {
    setSections((prev) => prev.filter((id) => id !== idToDelete));
  }

  function solveMode(mode: string) {
    if (true) {
      return <></>;
    }
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
                if (false) {
                  handleAdd();
                  setIconClicked(true);
                  setTimeout(() => setIconClicked(false), 150);
                }
              }}
              className="transition-all duration-150 cursor-pointer"
            />
          </div>
          {sections.map((id) => (
            <PreferenceSection
              sliderValue={timeValue}
              setSliderValue={setTimevalue}
              key={id}
              DropdownItems={["Time"]}
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
      createJobMutation.isPending ||
      pollFetching ||
      createTimeTableMutation.isPending ||
      resultOfPoll?.status === "queued"
    );
  }
  function dynamicSpinner() {
    let spinnerText = "";

    if (resultOfPoll !== null && resultOfPoll?.status === "queued") {
      if (createJobMutation.isPending) {
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
  function ManageSolverOptions() {
    return (
      <>
        <div className="space-y-2">
          <strong hidden>
            <p>Solve mode</p>
          </strong>
          <div className="flex flex-row gap-4">
            {" "}
            <Button
              hidden
              disabled={loadingStatus()}
              variant={"outline"}
              onClick={() => {
                setCurrentMode("feasibility");
              }}
            >
              Feasibility
            </Button>
            <Button
              hidden
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
        <div className="flex flex-col gap-y-2">
          <Input
            id="input-name-timetable"
            placeholder="Name timetable"
            value={timetableName}
            onChange={(e) => {
              setTimetableName(e.target.value);
            }}
          ></Input>
          <Button
            id="btn-upload-and-create-timetable"
            disabled={loadingStatus()}
            type="button"
            onClick={enrollUser}
          >
            Upload and Create Timetable
          </Button>
          <Button
            hidden
            disabled={loadingStatus()}
            type="button"
            onClick={() => {
              router.push("/schedules");
            }}
          >
            View Timetable
          </Button>
        </div>
      </>
    );
  }
  function handleError() {
    return resultOfPoll?.error as { code?: string; message?: string };
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
          {jobFailed == false ? (
            <>
              {!loadingStatus() ? (
                <>{ManageSolverOptions()}</>
              ) : (
                <>{dynamicSpinner()}</>
              )}
            </>
          ) : (
            <div>
              <p>
                Solving Failed
                <br />
                {handleError().message}
              </p>
              <Button
                onClick={() => {
                  setJobFailed(false);
                  setJobID(null);
                  getQueryClient().setQueryData(["solver", "poll"], null);
                }}
              >
                Confirm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
