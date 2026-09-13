"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import {
  createSolverJobBuilder,
  enrollModBuilder,
  pollSolverOutputBuilder,
  SolverPreferencesType,
} from "@/app/solver/queries/Solver/builder";
import { createTimeTableBuilder } from "@/app/builder/utils/timetables/TimeTableRequests";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { Input } from "@/components/atoms/baseShadcn/input";
import {
  SkipDayPref,
  SmallGapsPref,
  StartTimePref,
} from "@/components/molecules/solver/PreferenceHandler";
import { getAllTimetablesQ } from "@/components/templates/builder/Queries/timetableQueries";
import { errorName } from "../../../../utilities/errorCries";
import { useErrorListener } from "@/hooks/errorListener";
type solverProps = {
  modules: ModuleResponseDto[];
  onJobCompleteAction?: () => void;
};

export default function SolverPreferences({
  modules,
  onJobCompleteAction,
}: solverProps) {
  const [currentMode, setCurrentMode] = useState<
    "feasibility" | "optimization"
  >("feasibility");
  const [jobID, setJobID] = useState<string | null>(null);
  const [jobFailed, setJobFailed] = useState<boolean>(false);
  const [timetableCreated, setTimetableCreated] = useState<boolean>(false);
  const router = useRouter();
  const [timetableName, setTimetableName] = useState<string>("");

  const [startTime, setStartTime] = useState<string>("07:30");
  const [startTimeChecked, SetStartTimeChecked] = useState<boolean>(false);

  const [skipDay, setSkipDay] = useState<string>("Monday");
  const [skipChecked, setSkipChecked] = useState<boolean>(false);

  const [smallGapsChecked, setSmallGapsChecked] = useState<boolean>(false);

  function preferences() {
    return (
      <div className="flex flex-col w-full min-w-100 max-w-120    ">
        <div className="grid grid-cols-2  items-center gap-x-8  auto-rows-[minmax(30px,auto)]">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Choose Preferences
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)] text-center">
            Activate
          </span>
          <div className="col-span-2  border-b border-[var(--border)] " />
          <div className=" col-span-2 grid grid-cols-2  items-center gap-x-8 max-h-45  auto-rows-[minmax(30px,auto)] overflow-scroll">
            <StartTimePref
              startTime={startTime}
              onChange={setStartTime}
              setChecked={SetStartTimeChecked}
              activePreference={startTimeChecked}
            />

            <div className="col-span-2  " />
            <SkipDayPref
              setChecked={setSkipChecked}
              activePreference={skipChecked}
              day={skipDay}
              onChange={setSkipDay}
            />
            <div className="col-span-2   " />
            <SmallGapsPref
              activePreference={smallGapsChecked}
              setChecked={setSmallGapsChecked}
            />
            <div className="col-span-2  " />
          </div>
        </div>
      </div>
    );
  }

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
  function minToMid(): number {
    if (startTime != "") {
      const [hours, minutes] = startTime.split(":").map(Number);
      return hours * 60 + minutes;
    } else {
      return 0;
    }
  }

  function createPreferences() {
    const prefs: SolverPreferencesType["heuristics"] = [];
    if (startTimeChecked) {
      prefs.push({
        key: "preferred-start-time",
        parameters: {
          "minutes-After-midnight": minToMid(),
        },
      });
    }
    if (skipChecked) {
      prefs.push({
        key: "day-skip",
        parameters: {
          "day-to-skip": skipDay.toLowerCase() as
            "monday" | "tuesday" | "wednesday" | "thursday" | "friday",
        },
      });
    }
    if (smallGapsChecked) {
      prefs.push({
        key: "small-gaps",
      });
    }
    return prefs;
  }

  const createJobMutation = useMutation({
    mutationFn: async () => {
      const builder = new createSolverJobBuilder();
      const eventIDs = modules.flatMap(
        (module) => module.Events?.map((event) => event.eventId) ?? [],
      );

      const preferences = createPreferences();

      return await builder.send({
        body: {
          engine: preferences.length !== 0 ? "ga" : "auto",
          solveMode: currentMode,
          eventIds: eventIDs,
          preferences: {
            heuristics: preferences,
          },
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
        await createTimeTableMutation.mutateAsync();
        setJobID(null);
        getQueryClient().setQueryData(["solver", "poll"], null);
        if (timetableCreated === false) {
          getQueryClient().invalidateQueries({
            queryKey: getAllTimetablesQ().queryKey,
          });
          onJobCompleteAction?.();
          router.push("\schedules");
        }
      }
      if (resultOfPoll.status === "failed" && jobFailed === false) {
        console.log("set job to failed");
        setJobFailed(true);
      }
    }
  }
  useErrorListener();
  handleStatus();

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
        <div className="grid grid-cols-1 gap-y-2">
          <label className="flex flex-col gap-1  w-full">
            <span className="font-medium text-sm text-[var(--text-primary)]">
              Timetable name
            </span>
            <Input
              data-testid="input-solver-timetable-name"
              id="input-name-timetable"
              placeholder="My timetable"
              value={timetableName}
              className="h-8  w-full min-w-100 max-w-100 rounded-md border border-[var(--border)] bg-transparent px-3 text-left text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"

              onChange={(e) => {
                setTimetableName(e.target.value);
              }}
            ></Input>
          </label>

          {preferences()}
        </div>
        <div className="grid grid-cols-1 gap-y-2 mt-2">
          <Button
            data-testid="btn-upload-and-create-timetable"
            id="btn-upload-and-create-timetable"
            disabled={loadingStatus()}
            type="button"
            onClick={() => {
              if (timetableName != "") enrollUser();
              else {
                window.dispatchEvent(
                  new CustomEvent(errorName, {
                    detail: {
                      userMessage: "Please ensure you provide a timetable name",
                    },
                  }),
                );
              }
            }}
            className=" w-fit h-8"
          >
            Upload and Create Timetable
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
      {/* {TimetableCreatedDialog()} */}
      <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)] w-full h-full flex flex-col">
        <CardHeader className="text-xl font-bold text-[var(--text-primary)]">
          Set your preferences
        </CardHeader>

        <CardContent className=" overflow-y-auto flex-1">
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
