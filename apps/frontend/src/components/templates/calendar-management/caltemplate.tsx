"use client";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import createRestrictionHandlers from "@/components/molecules/Calendar-management/handlerCreator";
import CalCard from "@/components/organisms/Calandar-management/temporary-card";

import { useState } from "react";
import {
  CreateAcMutation,
  getAllAcQuery,
} from "../../../../utilities/Calendar-Builders/CalendarManagement";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GetAllRestrictions,
  RestrictionTypes,
  SingleRestrictionResp,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { useErrorListener } from "@/hooks/errorListener";

const startYear = 2026;
const endYear = 2035;

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
function toEnum(str: string) {
  return str.toUpperCase().replaceAll(" ", "_");
}
export default function CalTemplate() {
  const years = generateYears();
  const yearsWithAC: number[] = [];

  const [selectedYear, setSelectedYear] = useState(String(startYear));
  const [flagtempRes, setFlagTempRes] = useState<boolean>(false);
  const [tempRes, setTempRes] = useState<SingleRestrictionResp | null>();

  const { data: academicCalendars = [], isLoading: acLoading } = useQuery({
    ...getAllAcQuery(),
    select: (data) => {
      data.map((ac) => {
        if (!yearsWithAC.includes(ac.year)) yearsWithAC.push(ac.year);
      });
      //   setTempRes(null);
      //     setFlagTempRes(false);
      return data;
    },
  });

  const currentAC = academicCalendars.find(
    (ac) => ac.year === Number(selectedYear),
  );

  const selectedAcID = currentAC?.id;

  const { data: restrictions } = useQuery({
    ...GetAllRestrictions({ id: selectedAcID ?? "" }),
    enabled: selectedAcID != "" && selectedAcID != null,
  });

  const { mutateAsync: createACmut } = useMutation(CreateAcMutation);

  const handlers = createRestrictionHandlers();
  useErrorListener();
  return (
    <div className=" items-center flex flex-col gap-6 w-full px-6 capitalize">
      <div className="w-full  h-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Calendar Management
        </h1>
        <p className="text-sm text-[var(--text-secondary)] pl-4 pt-2 pb-2">
          Update and manage calendars by year
        </p>
        <div className="flex flex-col md:flex-row gap-4 p-5 border-b border-[var(--border)] items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select
              value={selectedYear}
              onValueChange={async (e) => {
                setSelectedYear(e);
                const year = Number(e);

                const AC = academicCalendars.find((ac) => year === ac.year);
                if (AC == undefined) {
                  await createACmut({
                    year: year,
                  });
                }
              }}
            >
              <SelectTrigger
                id="select-year"
                className="w-[180px] bg-[var(--background)]"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-50 capitalize">create restriction</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {ResTypes.map((type, idx) => {
                    return (
                      <DropdownMenuItem
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
            <Button
              hidden={!flagtempRes}
              onClick={() => {
                setTempRes(null);
                setFlagTempRes(false);
              }}
            >
              Clear Created restriction
            </Button>
          </div>
        </div>
        <div className="w-full h-full items-center flex flex-col p-4 px-10">
          {flagtempRes && tempRes && selectedAcID && (
            <div className="  border-dashed border-5 rounded-2xl my-2  flex flex-col items-center p-5 h-1/4">
              <div key={tempRes.type}>
                {handlers.handle(tempRes, currentAC, () => {
                  setFlagTempRes(false);
                  setTempRes(null);
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2  gap-y-5 p-5 w-full h-auto  justify-items-center items-center ">
            {selectedAcID &&
              restrictions?.restrictions.map((res) => {
                return (
                  <div key={res.id}>{handlers.handle(res, currentAC)}</div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
