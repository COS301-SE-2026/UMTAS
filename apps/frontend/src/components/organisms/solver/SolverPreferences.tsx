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
type solverProps = {
  modules: ModuleResponseDto[];
};

export default function SolverPreferences({ modules }: solverProps) {
  const [currentMode, setCurrentMode] = useState<
    "feasibility" | "optimization"
  >("feasibility");
  const [jobID, setJobID] = useState<string | null>(null);
  const [jobFailed, setJobFailed] = useState<boolean>(false);
  const [timetableCreated, setTimetableCreated] = useState<boolean>(false);
  const router = useRouter();
  const [timetableName, setTimetableName] = useState<string>("");

  const [startTime, setStartTime] = useState<string>("");
  const [startTimeChecked, SetStartTimeChecked] = useState<boolean>(false);

  const [skipDay, setSkipDay] = useState<string>("");
  const [skipChecked, setSkipChecked] = useState<boolean>(false);

  const [smallGapsChecked, setSmallGapsChecked] = useState<boolean>(false);

  function preferences() {
    return (
      <div className="flex flex-col w-full gap-y-5">
        <div className="grid grid-cols-2 w-full h-full justify-items-start items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <span>Choose Preferences</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <span>Activate Preference</span>
          </label>
        </div>
        <StartTimePref
          startTime={startTime}
          onChange={setStartTime}
          setChecked={SetStartTimeChecked}
          activePreference={startTimeChecked}
        />
        <SkipDayPref
          setChecked={setSkipChecked}
          activePreference={skipChecked}
          day={skipDay}
          onChange={setSkipDay}
        />
        <SmallGapsPref
          activePreference={smallGapsChecked}
          setChecked={setSmallGapsChecked}
        />
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
            | "monday"
            | "tuesday"
            | "wednesday"
            | "thursday"
            | "friday",
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
      console.log(createPreferences());
      const builder = new createSolverJobBuilder();
      const eventIDs = modules.flatMap(
        (module) => module.Events?.map((event) => event.eventId) ?? [],
      );
      return await builder.send({
        body: {
          engine: "auto",
          solveMode: currentMode,
          eventIds: eventIDs,
          preferences: {
            heuristics: createPreferences(),
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
          router.push("\schedules");
        }
      }
      if (resultOfPoll.status === "failed" && jobFailed === false) {
        console.log("set job to failed");
        setJobFailed(true);
      }
    }
  }

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
        {preferences()}
        <div className="flex flex-col gap-y-2">
          <Input
            data-testid="input-solver-timetable-name"
            id="input-name-timetable"
            placeholder="Name timetable"
            value={timetableName}
            onChange={(e) => {
              setTimetableName(e.target.value);
            }}
          ></Input>
          <Button
            data-testid="btn-upload-and-create-timetable"
            id="btn-upload-and-create-timetable"
            disabled={loadingStatus()}
            type="button"
            onClick={enrollUser}
            className="mt-4 w-fit"
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
        <CardDescription className="px-4">
          These are soft preferences. They shape which timetable is picked,
          never making a timetable invalid
        </CardDescription>

        <CardContent className="space-y-4 overflow-y-auto flex-1">
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
