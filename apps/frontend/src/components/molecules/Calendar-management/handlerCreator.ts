import { DateOnlyHanlder } from "./DateRestrictionHandler";
import { RangeDayHandler } from "./RangeRestrictionHandler";

export default function createRestrictionHandlers() {
  const start = new DateOnlyHanlder();
  start.setNext(new RangeDayHandler());
  return start;
}
