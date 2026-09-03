import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { useMutation } from "@tanstack/react-query";
import { Save, Trash2 } from "lucide-react";

import { useState } from "react";
import {
  SingleRestrictionResp,
  UpdateRestrictionMutation,
  DelRestrictionMut,
  CreateRestrictionMutation,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  errorManagement,
  RestrictionHandler,
  restrictionProps,
} from "./restriction-handlers";
import { errorName } from "../../../../utilities/errorCries";
import { getAcademicCalendarResp } from "../../../../utilities/Calendar-Builders/CalendarManagement";

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
    academicCalendarID: getAcademicCalendarResp,
    onSave?: () => void,
  ): React.ReactNode {
    return (
      <DateRestrictionHTML
        resType={resType}
        academicCalendarID={academicCalendarID}
        onSave={onSave}
      />
    );
  }
}

function ValidateRes(res: SingleRestrictionResp) {
  const errorMessage: errorManagement = {
    error: "",
    isError: false,
  };

  if (res.description == "") {
    errorMessage.isError = true;
    errorMessage.error = "Description cannot be empty";
  } else if (res.startDate == "") {
    errorMessage.isError = true;
    errorMessage.error = "Start date must be set";
  }
  return errorMessage;
}
function DateRestrictionHTML({
  resType,
  academicCalendarID,
  onSave,
}: restrictionProps) {
  const { mutate: updateMut, isPending: savePending } = useMutation(
    UpdateRestrictionMutation,
  );
  const { mutate: deleteMut, isPending: deletePending } = useMutation({
    ...DelRestrictionMut,
  });
  const { mutate: CreateRestriction } = useMutation(CreateRestrictionMutation);

  const [restriction, setRestriction] =
    useState<SingleRestrictionResp>(resType);

  function save() {
    if (restriction.id !== "")
      updateMut({
        body: {
          description: restriction.description,
          startDate: restriction.startDate,
          type: restriction.type,
        },
        paths: {
          restrictionId: restriction.id,
          id: academicCalendarID.id,
        },
      });
    else {
      CreateRestriction({
        body: {
          description: restriction.description,
          startDate: restriction.startDate,
          type: restriction.type,
        },
        paths: {
          id: academicCalendarID.id,
        },
      });
      onSave?.();
    }
  }

  function deleteRes() {
    deleteMut({
      paths: {
        id: academicCalendarID.id,
        restrictionId: restriction.id,
      },
    });
  }
  const minDate = `${academicCalendarID.year}-01-01`;
  const maxDate = `${academicCalendarID.year}-12-31`;
  return (
    <div className="flex flex-col w-full gap-y-4">
      <div className="flex flex-col gap-y-1.5 w-full">
        <Label className="text-sm font-medium text-[var(--text-primary)] text-left pl-1">
          Selected date
        </Label>
        <div className="flex flex-row items-center gap-x-5 w-full">
          <Input
            data-testid="restriction-Date-Input"
            type="date"
            value={restriction.startDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => {
              setRestriction((res) => ({
                ...res,
                startDate: e.target.value,
              }));
            }}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-left text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
          <Button
            id="btn-delete-restriction"
            type="button"
            variant="ghost"
            size="icon"
            hidden={restriction.id === ""}
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
        </div>
      </div>

      <div className="flex flex-col gap-y-1.5 w-full">
        <Label className="text-sm font-medium text-[var(--text-primary)] text-left pl-1">
          Description
        </Label>
        <div className="flex flex-row items-center gap-x-5 w-full">
          <Input
            data-testid="restriction-dsc-Input"
            type="text"
            value={restriction.description}
            onChange={(e) => {
              setRestriction((res) => ({
                ...res,
                description: e.target.value,
              }));
            }}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-left text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
          <Button
            id="btn-save-restriction"
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const check = ValidateRes(restriction);

              if (check.isError) {
                window.dispatchEvent(
                  new CustomEvent(errorName, {
                    detail: {
                      userMessage: check.error,
                    },
                  }),
                );
              } else save();
            }}
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
      </div>
    </div>
  );
}
