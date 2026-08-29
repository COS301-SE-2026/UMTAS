// uses chain of responsibility and template method

import {
  DelRestrictionMut,
  RestrictionTypes,
  SingleRestrictionResp,
  UpdateRestrictionMutation,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";

abstract class RestrictionHandler {
  protected MyHandletypes: RestrictionTypes[];
  protected next: RestrictionHandler | null = null;

  constructor(types: RestrictionTypes[]) {
    this.MyHandletypes = types;
  }

  protected setNext(next: RestrictionHandler) {
    if (this.next) {
      this.next.setNext(next);
    } else {
      this.next = next;
    }
  }
  public handle(
    resType: SingleRestrictionResp,
    academicCalendarID: string,
  ): React.ReactNode {
    if (this.MyHandletypes.includes(resType.type)) {
      return this.handleHtml(resType, academicCalendarID);
    } else {
      return this.next?.handle(resType, academicCalendarID);
    }
  }

  abstract handleHtml(
    resType: SingleRestrictionResp,
    academicCalendarID: string,
  ): React.ReactNode; // returns the self managing elements
}

/*
(alias) type RestrictionTypes = "SEMESTER_1_START"
| "SEMESTER_1_END" | "SEMESTER_2_START"
| "SEMESTER_2_END" | "HOLIDAY" | "PUBLIC_HOLIDAY"
| "UNIVERSITY_CLOSURE" | "RECESS" | "TEST_WEEK"
| "EXAM_PERIOD" | "SUPP_WEEK" | "DAY_SWAP"
import RestrictionTypes
*/

export class DateOnlyHanlder extends RestrictionHandler {
  constructor() {
    super([
      "SEMESTER_1_START",
      "SEMESTER_1_END",
      "SEMESTER_2_END",
      "SEMESTER_2_START",
      "UNIVERSITY_CLOSURE",
      "PUBLIC_HOLIDAY",
    ]);
  }
  handleHtml(
    resType: SingleRestrictionResp,
    academicCalendarID: string,
  ): React.ReactNode {
    return (
      <DateRestrictionHTML
        resType={resType}
        academicCalendarID={academicCalendarID}
      />
    );
  }
}

interface restrictionProps {
  resType: SingleRestrictionResp;
  academicCalendarID: string;
}

function RestrictionContainerHtml() {}

function DateRestrictionHTML({
  resType,
  academicCalendarID,
}: restrictionProps) {
  const { mutate: updateMut, isPending: savePending } = useMutation(
    UpdateRestrictionMutation,
  );
  const { mutate: deleteMut, isPending: deletePending } = useMutation({
    ...DelRestrictionMut,
  });

  const [restriction, setRestriction] =
    useState<SingleRestrictionResp>(resType);

  function save() {
    updateMut({
      body: {
        description: restriction.description,
        startDate: restriction.startDate,
        type: restriction.type,
      },
      paths: {
        restrictionId: restriction.id,
        id: academicCalendarID,
      },
    });
  }
  function deleteRes() {
    deleteMut({
      paths: {
        id: academicCalendarID,
        restrictionId: restriction.id,
      },
    });
  }

  return (
    <div className="flex flex-row w-full  items-center justify-items-center gap-4 text-center ">
      <Label className="text-sm font-medium text-[var(--text-secondary)] flex flex-col">
        Selected date
        <Input
          data-testid="restriction-Date-Input"
          type="date"
          value={restriction.startDate}
          onChange={(e) => {
            if (e.target.value) {
              {
                setRestriction((res) => ({
                  ...res,
                  startDate: e.target.value,
                }));
              }
            }
          }}
          className="h-8 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </Label>
      <Label className="text-sm font-medium text-[var(--text-secondary)] flex flex-col">
        description
        <Input
          data-testid="restriction-dsc-Input"
          type="text"
          value={restriction.description}
          onChange={(e) => {
            if (e.target.value) {
              {
                setRestriction((res) => ({
                  ...res,
                  description: e.target.value,
                }));
              }
            }
          }}
          className="h-8  rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </Label>
      <Button
        id="btn-delete-restriction"
        type="button"
        variant="ghost"
        size="icon"
        onClick={deleteRes}
        disabled={deletePending}
        className="h-10 w-10 flex-shrink-0 border border-[var(--error-text)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--error-text)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)]"
      >
        <Trash2
          size={16}
          strokeWidth={1.5}
          className="text-[var(--error-text)]"
        />
      </Button>
      <Button
        id="btn-delete-restriction"
        type="button"
        variant="ghost"
        size="icon"
        onClick={save}
        disabled={savePending}
        className="h-10 w-10 flex-shrink-0 border border-[var(--success-text)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--success-text)] hover:text-[var(--success-text)] hover:bg-[var(--success-bg)]"
      >
        {savePending ? (
          <Spinner />
        ) : (
          <Save
            size={16}
            strokeWidth={1.5}
            className="text-[var(--success-text)]"
          />
        )}
      </Button>
    </div>
  );
}

export class DayToDayHanlder extends RestrictionHandler {
  constructor() {
    super(["EXAM_PERIOD", "SUPP_WEEK", "TEST_WEEK", "HOLIDAY", "RECESS"]);
  }
  handleHtml(resType: SingleRestrictionResp): React.ReactNode {
    return <></>;
  }
}
