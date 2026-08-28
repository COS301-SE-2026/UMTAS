import {
  getAcRestrictionResp,
  RestrictionTypes,
  SingleRestrictionResp,
} from "../../../../utilities/Calendar-Builders/RestrictionManagement";

abstract class RestrictionHandler {
  protected MyHandletype: RestrictionTypes;
  protected next: RestrictionHandler | null = null;

  constructor(type: RestrictionTypes) {
    this.MyHandletype = type;
  }

  protected setNext(next: RestrictionHandler) {
    if (this.next) {
      this.next.setNext(next);
    } else {
      this.next = next;
    }
  }
  protected handle(resType: SingleRestrictionResp) {
    if ((this.MyHandletype = resType.type)) {
      return this.handleFunction(resType);
    } else {
      this.next?.handle(resType);
    }
  }

  abstract handleFunction(resType: SingleRestrictionResp): React.ReactNode; // returns the self managing elements
}

/*
(alias) type RestrictionTypes = "SEMESTER_1_START"
| "SEMESTER_1_END" | "SEMESTER_2_START"
| "SEMESTER_2_END" | "HOLIDAY" | "PUBLIC_HOLIDAY"
| "UNIVERSITY_CLOSURE" | "RECESS" | "TEST_WEEK"
| "EXAM_PERIOD" | "SUPP_WEEK" | "DAY_SWAP"
import RestrictionTypes
*/
