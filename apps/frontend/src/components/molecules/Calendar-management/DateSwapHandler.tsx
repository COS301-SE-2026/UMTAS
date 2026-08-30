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
  RestrictionDays,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";
import { Label } from "@/components/atoms/baseShadcn/label";
import { RestrictionHandler, restrictionProps } from "./restriction-handlers";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/baseShadcn/select";

export const EnumDays: RestrictionDays[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];
function toEnum(str: string) {
  return str.toUpperCase();
}
function toRead(str: string) {
  return str.toLowerCase();
}

export class DateSwapHandler extends RestrictionHandler {
  constructor() {
    super(["DAY_SWAP"]);
  }
  handleHtml(
    resType: SingleRestrictionResp,
    academicCalendarID: string,
  ): React.ReactNode {
    return (
      <DateSwapHtml resType={resType} academicCalendarID={academicCalendarID} />
    );
  }
}

function DateSwapHtml({ resType, academicCalendarID }: restrictionProps) {
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
        replacementWeekday: restriction.replacementWeekday ?? undefined,
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
            Day to swap
            <Select
              value={restriction?.replacementWeekday ?? "monday"}
              onValueChange={async (e) => {
                if (e) {
                  {
                    setRestriction((res) => ({
                      ...res,
                      replacementWeekday: toEnum(e) as RestrictionDays,
                    }));
                  }
                }
              }}
            >
              <SelectTrigger id="select-year" className="capitalize w-40 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="capitalize">
                {EnumDays.map((type, idx) => (
                  <SelectItem key={idx} value={type}>
                    {toRead(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    </div>
  );
}
