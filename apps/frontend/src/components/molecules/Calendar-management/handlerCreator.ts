import { DateOnlyHanlder } from "./DateRestrictionHandler";
import { RangeDayHandler } from "./restriction-handlers";

export default function createRestrictionHandlers() {
  const start = new DateOnlyHanlder();
  start.setNext(new RangeDayHandler());
  return start;
}
