import type { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../../utilities/request";

type GenerateCalendarOperation =
  paths["/api/academic-calendar/generate"]["post"];

export type GenerateCalendarBody =
  GenerateCalendarOperation["requestBody"]["content"]["application/json"];

export type GeneratedCalendarResponse =
  GenerateCalendarOperation["responses"]["201"]["content"]["application/json"];

class GenerateCalendarBuilder extends RequestBuilder<
  undefined,
  GenerateCalendarBody,
  GeneratedCalendarResponse
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar/generate").setMethod(RequestMethod.POST);
  }
}

export async function generateCalendarPayload(
  timetableId: string,
): Promise<GeneratedCalendarResponse["payload"]> {
  const generated = await new GenerateCalendarBuilder().send({
    body: { timetableId },
  });
  return generated.payload;
}
