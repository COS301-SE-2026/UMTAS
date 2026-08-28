// uses chain of responsibility and template method
import { useState } from "react";
import {
  RestrictionTypes,
  SingleRestrictionResp,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";
import { Input } from "@/components/atoms/baseShadcn/input";

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
  protected handle(resType: SingleRestrictionResp): React.ReactNode {
    if (this.MyHandletypes.includes(resType.type)) {
      return this.handleHtml(resType);
    } else {
      return this.next?.handle(resType);
    }
  }

  abstract handleHtml(resType: SingleRestrictionResp): React.ReactNode; // returns the self managing elements
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
      "EXAM_PERIOD",
      "SUPP_WEEK",
      "TEST_WEEK",
      "UNIVERSITY_CLOSURE",
      "PUBLIC_HOLIDAY",
      "HOLIDAY",
      "RECESS",
    ]);
  }
  handleHtml(resType: SingleRestrictionResp): React.ReactNode {
    return <CalendarRestrictionHTML resType={resType} />;
  }
}

interface restrictionProps {
  resType: SingleRestrictionResp;
}

function CalendarRestrictionHTML({ resType }: restrictionProps) {
  const [restriction, setRestriction] =
    useState<SingleRestrictionResp>(resType);

  return (
    <div>
      <Input></Input>
    </div>
  );
}
