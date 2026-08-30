// uses chain of responsibility and template method

import {
  RestrictionTypes,
  SingleRestrictionResp,
  UpdateRestrictionMutation,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";

import { ReactNode, useState } from "react";

import CalCard from "@/components/organisms/Calandar-management/temporary-card";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Select,
} from "@/components/atoms/baseShadcn/select";
import { useMutation } from "@tanstack/react-query";
import { getAcademicCalendarResp } from "../../../../utilities/Calendar-Builders/CalendarManagement";

export abstract class RestrictionHandler {
  protected MyHandletypes: RestrictionTypes[];
  protected next: RestrictionHandler | null = null;

  constructor(types: RestrictionTypes[]) {
    this.MyHandletypes = types;
  }

  public setNext(next: RestrictionHandler) {
    if (this.next) {
      this.next.setNext(next);
    } else {
      this.next = next;
    }
  }
  public handle(
    resType: SingleRestrictionResp,
    academicCalendarID: getAcademicCalendarResp,
    onSave?: () => void,
  ): React.ReactNode {
    if (this.MyHandletypes.includes(resType.type)) {
      return (
        <RestrictionContainerHtml
          res={resType}
          availableTypes={this.MyHandletypes}
          academicCalendarID={academicCalendarID}
        >
          {this.handleHtml(resType, academicCalendarID, onSave)}
        </RestrictionContainerHtml>
      );
    } else {
      return this.next?.handle(resType, academicCalendarID, onSave);
    }
  }

  abstract handleHtml(
    resType: SingleRestrictionResp,
    academicCalendarID: getAcademicCalendarResp,
    onSave?: () => void,
  ): React.ReactNode; // returns the self managing elements
}
interface containerProp {
  children: ReactNode;
  res: SingleRestrictionResp;
  availableTypes: RestrictionTypes[];
  academicCalendarID: getAcademicCalendarResp;
}

function RestrictionContainerHtml({
  children,
  res,
  availableTypes,
  academicCalendarID,
}: containerProp) {
  function toRead(str: string) {
    str = str.toLocaleLowerCase().replaceAll("_", " ");
    return str;
  }
  function toEnum(str: string) {
    return str.toUpperCase().replaceAll(" ", "_");
  }

  const [restriction, setRestriction] = useState<SingleRestrictionResp>(res);

  const { mutate: updateMut } = useMutation(UpdateRestrictionMutation);

  function save(updated: string) {
    updateMut({
      body: {
        description: restriction.description,
        startDate: restriction.startDate,
        type: updated as RestrictionTypes,
      },
      paths: {
        restrictionId: restriction.id,
        id: academicCalendarID.id,
      },
    });
  }
  return (
    <div className="flex flex-col text-left  ">
      <CalCard>
        <div className="flex flex-col gap-y-2">
          <Select
            disabled={restriction.id == ""}
            value={restriction.type}
            onValueChange={async (e) => {
              setRestriction((res) => ({
                ...res,
                type: toEnum(e) as RestrictionTypes,
              }));
              save(toEnum(e));
            }}
          >
            <SelectTrigger
              id="select-year"
              className="capitalize w-40 bg-[var(--background)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type, idx) => (
                <SelectItem key={idx} value={type}>
                  {toRead(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="">{children}</div>
        </div>
      </CalCard>
    </div>
  );
}

export interface restrictionProps {
  resType: SingleRestrictionResp;
  academicCalendarID: getAcademicCalendarResp;
  onSave?: () => void;
}

export type errorManagement = {
  error: string;
  isError: boolean;
};
/*
(alias) type RestrictionTypes = "SEMESTER_1_START"
| "SEMESTER_1_END" | "SEMESTER_2_START"
| "SEMESTER_2_END" | "HOLIDAY" | "PUBLIC_HOLIDAY"
| "UNIVERSITY_CLOSURE" | "RECESS" | "TEST_WEEK"
| "EXAM_PERIOD" | "SUPP_WEEK" | "DAY_SWAP"
import RestrictionTypes
*/
