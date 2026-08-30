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
import { ReactNode, useState } from "react";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import CalCard from "@/components/organisms/Calandar-management/temporary-card";

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
    academicCalendarID: string,
  ): React.ReactNode {
    if (this.MyHandletypes.includes(resType.type)) {
      return (
        <RestrictionContainerHtml type={resType.type + " : "}>
          {this.handleHtml(resType, academicCalendarID)}
        </RestrictionContainerHtml>
      );
    } else {
      return this.next?.handle(resType, academicCalendarID);
    }
  }

  abstract handleHtml(
    resType: SingleRestrictionResp,
    academicCalendarID: string,
  ): React.ReactNode; // returns the self managing elements
}
interface containerProp {
  children: ReactNode;
  type: string;
}
function RestrictionContainerHtml({ children, type }: containerProp) {
  return (
    <div className="flex flex-col text-left ">
      <h1 className="text-sm font-bold tracking-tight text-[var(--text-secondary)]  ">
        {type.toLowerCase().replaceAll("_", " ")}
      </h1>
      <CalCard>
        <div className="p-4">{children}</div>
      </CalCard>
    </div>
  );
}

export interface restrictionProps {
  resType: SingleRestrictionResp;
  academicCalendarID: string;
}

/*
(alias) type RestrictionTypes = "SEMESTER_1_START"
| "SEMESTER_1_END" | "SEMESTER_2_START"
| "SEMESTER_2_END" | "HOLIDAY" | "PUBLIC_HOLIDAY"
| "UNIVERSITY_CLOSURE" | "RECESS" | "TEST_WEEK"
| "EXAM_PERIOD" | "SUPP_WEEK" | "DAY_SWAP"
import RestrictionTypes
*/
