import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getAllVenuesPath =
  paths["/api/venues"]["get"]["parameters"]["path"];
export type getAllVenuesRes =
  paths["/api/venues"]["get"]["responses"]["200"]["content"]["application/json"];

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
  undefined,
  getAllVenuesPath,
  getAllVenuesRes
> {
  constructor() {
    super();
    this.setUrl("/venues").setMethod(RequestMethod.GET);
  }
}

export class assignVenueBuilder extends RequestBuilder<
  assignVenueBody,
  assignVenuePath,
  assignVenueRes
> {
  constructor() {
    super();
    this.setUrl("/venues/{venueId}/building").setMethod(RequestMethod.PATCH);
  }
}

export class bulkAssignVenueBuilder extends RequestBuilder<
  bulkAssignVenueBody,
  bulkAssignVenuePath,
  bulkAssignVenueRes
> {
  constructor() {
    super();
    this.setUrl("/venues/assign").setMethod(RequestMethod.POST);
  }
}
