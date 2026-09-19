"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import Tutorial from "@/components/organisms/nav/Tutorial";
import createRestrictionHandlers from "@/components/molecules/Calendar-management/handlerCreator";

import { useState } from "react";
import {
  CreateAcMutation,
  getPublicAcQuery,
  getAllAcQuery,
  UpdateAcSubscriptionsMutation,
} from "../../../../utilities/Calendar-Builders/CalendarManagement";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GetAllRestrictions,
  RestrictionTypes,
  SingleRestrictionResp,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { useErrorListener } from "@/hooks/errorListener";

const startYear = 2026;
const endYear = 2040;

function generateYears() {
  const length = endYear - startYear;
  const years = [String(startYear)];

  for (let i = 1; i < length; i++) {
    years.push(String(startYear + i));
  }

  return years;
}

const ResTypes: RestrictionTypes[] = [
  "SEMESTER_1_START",
  "SEMESTER_1_END",
  "SEMESTER_2_START",
  "SEMESTER_2_END",
  "HOLIDAY",
  "PUBLIC_HOLIDAY",
  "UNIVERSITY_CLOSURE",
  "RECESS",
  "TEST_WEEK",
  "EXAM_PERIOD",
  "SUPP_WEEK",
  "DAY_SWAP",
];

function toRead(str: string) {
  str = str.toLocaleLowerCase().replaceAll("_", " ");
  return str;
}

const steps = [
  {
    target: "#calendar-management",
    content:
      "Manage your university's academic calendars, public holidays, and calendar restrictions here.",
  },
  {
    target: "#select-calendar-year",
    content:
      "Select the academic year you want to manage. A calendar will be created automatically if one does not already exist.",
  },
  {
    target: "#include-public-holidays",
    content:
      "Choose whether the public holiday calendar should be included for the selected academic year.",
  },
  {
    target: "#create-restriction",
    content:
      "Create a new calendar restriction and choose its type, such as a semester period, recess, test week, or exam period.",
  },
  {
    target: "#calendar-restrictions",
    content:
      "View and manage all restrictions for the selected academic year here.",
  },
];

export default function CalTemplate() {
  const years = generateYears();
  const yearsWithAC: number[] = [];

  const [selectedYear, setSelectedYear] = useState(String(startYear));
  const [flagtempRes, setFlagTempRes] = useState<boolean>(false);
  const [tempRes, setTempRes] = useState<SingleRestrictionResp | null>();

  const { data: academicCalendars = [] } = useQuery({
    ...getAllAcQuery(),
    select: (data) => {
      data.map((ac) => {
        if (!yearsWithAC.includes(ac.year)) {
          yearsWithAC.push(ac.year);
        }
      });

      return data;
    },
  });

  const currentAC = academicCalendars.find(
    (ac) => ac.year === Number(selectedYear),
  );

  const selectedAcID = currentAC?.id;

  const { data: publicCalendars = [] } = useQuery(getPublicAcQuery());

  const publicHolidayCalendar = publicCalendars.find(
    (calendar) => calendar.year === Number(selectedYear),
  );

  const includePublicHolidays = Boolean(
    publicHolidayCalendar &&
    currentAC?.subscriptions.includes(publicHolidayCalendar.id),
  );

  const { data: restrictions } = useQuery({
    ...GetAllRestrictions({ id: selectedAcID ?? "" }),
    enabled: selectedAcID != "" && selectedAcID != null,
  });

  const { mutateAsync: createACmut } = useMutation(CreateAcMutation);

  const { mutate: updateSubscriptions, isPending: isUpdatingSubscriptions } =
    useMutation(UpdateAcSubscriptionsMutation);

  const handlers = createRestrictionHandlers();

  useErrorListener();

  return (
    <>
      {/* <Tutorial steps={steps} wait={true} /> */}

      <div className="flex w-full flex-col items-center gap-6 px-6 pt-6 capitalize">
        <div
          id="calendar-management"
          className="w-full max-w-6xl overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm"
        >
          {/* Header */}
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Calendar Management
            </h1>

            <p className="mt-1 text-sm normal-case text-[var(--text-secondary)]">
              Manage academic periods, holidays, recesses and important
              university dates.
            </p>
          </div>

          {/* Controls */}
          <div className="mx-5 mt-5 flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-4">
              {/* Academic Year */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="select-calendar-year"
                  className="text-sm font-medium text-[var(--text-secondary)]"
                >
                  Academic Year
                </Label>

                <Select
                  value={selectedYear}
                  onValueChange={async (e) => {
                    setSelectedYear(e);

                    const year = Number(e);

                    const AC = academicCalendars.find((ac) => year === ac.year);

                    if (AC == undefined || AC == null || AC.id == "") {
                      await createACmut({
                        year: year,
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    id="select-calendar-year"
                    data-testid="SELECT_NEW_YEAR"
                    className="w-[180px] bg-[var(--bg-surface)]"
                  >
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>

                  <SelectContent>
                    {years.map((year, idx) => (
                      <SelectItem key={idx} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Public Holidays */}
              <Label
                htmlFor="include-public-holidays"
                className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap"
              >
                <Checkbox
                  id="include-public-holidays"
                  checked={includePublicHolidays}
                  disabled={
                    !selectedAcID ||
                    !publicHolidayCalendar ||
                    isUpdatingSubscriptions
                  }
                  onCheckedChange={(checked) => {
                    if (!selectedAcID || !publicHolidayCalendar) {
                      return;
                    }

                    updateSubscriptions({
                      paths: {
                        id: selectedAcID,
                      },
                      body: {
                        subscriptions: checked
                          ? [publicHolidayCalendar.id]
                          : [],
                      },
                    });
                  }}
                  className="
                  border
                  border-[var(--text-secondary)]
                  bg-[var(--bg-surface)]
                  data-[state=checked]:border-[var(--btn-primary-bg)]
                  data-[state=checked]:bg-[var(--btn-primary-bg)]
                  data-[state=checked]:text-[var(--btn-primary-text)]
                "
                />

                <span className="text-sm text-[var(--text-primary)]">
                  Include public holidays
                </span>
              </Label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id="create-restriction"
                    data-testid="CREATE_RESTRICTION"
                    className="w-fit capitalize"
                  >
                    Create restriction
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    {ResTypes.map((type, idx) => {
                      return (
                        <DropdownMenuItem
                          data-testid={`MENU_ITEM_${type}`}
                          className="capitalize"
                          key={idx}
                          onSelect={() => {
                            setFlagTempRes(true);
                            setTempRes(null);

                            setTempRes({
                              type: type as RestrictionTypes,
                              description: "",
                              id: "",
                              startDate: "",
                              endDate: "",
                            });
                          }}
                        >
                          {toRead(type)}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {flagtempRes && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setTempRes(null);
                    setFlagTempRes(false);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Restrictions */}
          <div id="calendar-restrictions" className="flex w-full flex-col p-5">
            {flagtempRes && tempRes && selectedAcID && (
              <div className="mb-5 w-full rounded-xl border-2 border-dashed border-[var(--border)] p-4">
                <div
                  data-testid="TEMP_CONTAINER"
                  key={tempRes.type}
                  className="w-full"
                >
                  {handlers.handle(tempRes, currentAC, () => {
                    setFlagTempRes(false);
                    setTempRes(null);
                  })}
                </div>
              </div>
            )}

            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
              {selectedAcID &&
                restrictions?.restrictions.map((res) => (
                  <div
                    data-testid="ADDED_CONTAINER"
                    key={res.id}
                    className="w-full"
                  >
                    {handlers.handle(res, currentAC)}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
