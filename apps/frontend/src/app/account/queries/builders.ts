import { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../../../utilities/request";

type RevokeGoogleCalendarAccessResponse =
  paths["/api/auth/google/revoke-calendar-access"]["post"]["responses"]["204"];

export class RevokeGoogleCalendarAccessBuilder extends RequestBuilder<
  undefined,
  Record<string, never>,
  RevokeGoogleCalendarAccessResponse
> {
  constructor() {
    super();
    this.setUrl("/auth/google/revoke-calendar-access").setMethod(
      RequestMethod.POST,
    );
  }
}
