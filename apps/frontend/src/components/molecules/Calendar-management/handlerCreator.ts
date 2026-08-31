import { DateOnlyHanlder } from "./DateRestrictionHandler";
import { DateSwapHandler } from "./DateSwapHandler";
import { RangeDayHandler } from "./RangeRestrictionHandler";

export default function createRestrictionHandlers() {
  const start = new DateOnlyHanlder();
  start.setNext(new RangeDayHandler());
  start.setNext(new DateSwapHandler());
  return start;
}
