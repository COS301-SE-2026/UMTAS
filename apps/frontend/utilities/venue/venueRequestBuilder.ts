import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getAllVenuesPath =
  paths["/api/venues"]["get"]["parameters"]["path"];
export type getAllVenuesRes =
  paths["/api/venues"]["get"]["responses"]["200"]["content"]["application/json"];
export type getAllVenuesQuery =
  paths["/api/venues"]["get"]["parameters"]["query"];

export type assignVenueBody =
  paths["/api/venues/{venueId}/building"]["patch"]["requestBody"]["content"]["application/json"];
export type assignVenuePath =
  paths["/api/venues/{venueId}/building"]["patch"]["parameters"]["path"];
export type assignVenueRes =
  paths["/api/venues/{venueId}/building"]["patch"]["responses"]["200"]["content"]["application/json"];

export type bulkAssignVenueBody =
  paths["/api/venues/assign"]["post"]["requestBody"]["content"]["application/json"];
export type bulkAssignVenuePath =
  paths["/api/venues/assign"]["post"]["parameters"]["path"];
export type bulkAssignVenueRes =
  paths["/api/venues/assign"]["post"]["responses"]["200"]["content"]["application/json"];

export class getAllVenuesBuilder extends RequestBuilder<
  getAllVenuesQuery,
  undefined,
  getAllVenuesRes
> {
  constructor() {
    super();
    this.setUrl("/venues").setMethod(RequestMethod.GET);
  }
}

export class assignVenueBuilder extends RequestBuilder<
  assignVenuePath,
  assignVenueBody,
  assignVenueRes
> {
  constructor() {
    super();
    this.setUrl("/venues/{venueId}/building").setMethod(RequestMethod.PATCH);
  }
}

export class bulkAssignVenueBuilder extends RequestBuilder<
  bulkAssignVenuePath,
  bulkAssignVenueBody,
  bulkAssignVenueRes
> {
  constructor() {
    super();
    this.setUrl("/venues/assign").setMethod(RequestMethod.POST);
  }
}
