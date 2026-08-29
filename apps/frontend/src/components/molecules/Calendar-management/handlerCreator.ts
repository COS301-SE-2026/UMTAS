import { DateOnlyHanlder } from "./restriction-handlers";

export default function createRestrictionHandlers() {
  const start = new DateOnlyHanlder();

  return start;
}
