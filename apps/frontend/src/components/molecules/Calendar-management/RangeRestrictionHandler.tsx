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
export class RangeDayHandler extends RestrictionHandler {
  constructor() {
    super(["EXAM_PERIOD", "SUPP_WEEK", "TEST_WEEK", "HOLIDAY", "RECESS"]);
  }
  handleHtml(
    resType: SingleRestrictionResp,
    academicCalendarID: string,
    onSave?: () => void,
  ): React.ReactNode {
    return (
      <RangeDateHTML
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
  } else if (res.endDate == "") {
    errorMessage.isError = true;
    errorMessage.error = "End date must be set";
  }
  return errorMessage;
}
function RangeDateHTML({
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
          endDate: restriction.endDate,
        },
        paths: {
          restrictionId: restriction.id,
          id: academicCalendarID,
        },
      });
    else {
      CreateRestriction({
        body: {
          description: restriction.description,
          startDate: restriction.startDate,
          type: restriction.type,
          endDate: restriction.endDate,
        },
        paths: {
          id: academicCalendarID,
        },
      });
      onSave?.();
    }
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
    <div className="flex flex-row w-full  items-center justify-items-center gap-6 text-center ">
      <div className="w-full flex flex-col gap-y-2">
        <div className="w-full grid grid-cols-2 gap-x-2">
          <Label className="text-sm font-medium text-[var(--text-secondary)] flex flex-col">
            Start Date
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
            End Date
            <Input
              data-testid="restriction-Date-Input"
              type="date"
              value={restriction.endDate}
              onChange={(e) => {
                if (e.target.value) {
                  {
                    setRestriction((res) => ({
                      ...res,
                      endDate: e.target.value,
                    }));
                  }
                }
              }}
              className="h-8 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </Label>
        </div>

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
      </div>
      <div className="flex flex-col gap-y-5">
        <Button
          id="btn-delete-restriction"
          type="button"
          variant="ghost"
          hidden={restriction.id == ""}
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
  );
}
