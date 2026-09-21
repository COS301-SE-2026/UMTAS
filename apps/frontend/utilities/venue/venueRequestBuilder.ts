import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getAllVenuesPath =
  paths["/api/venues"]["get"]["parameters"]["path"];
export type getAllVenuesRes =
  paths["/api/venues"]["get"]["responses"]["200"]["content"]["application/json"];
export type getAllVenuesQuery =
  paths["/api/venues"]["get"]["parameters"]["query"];

export type assignVenueBody =
  paths["/api/venues/{venueId}"]["patch"]["requestBody"]["content"]["application/json"];
export type assignVenuePath =
  paths["/api/venues/{venueId}"]["patch"]["parameters"]["path"];
export type assignVenueRes =
  paths["/api/venues/{venueId}"]["patch"]["responses"]["200"]["content"]["application/json"];

// export type bulkAssignVenueBody =
//   paths["/api/venues/assign"]["post"]["requestBody"]["content"]["application/json"];
// export type bulkAssignVenuePath =
//   paths["/api/venues/assign"]["post"]["parameters"]["path"];
// export type bulkAssignVenueRes =
//   paths["/api/venues/assign"]["post"]["responses"]["200"]["content"]["application/json"];

export type updateEventVenuePath =
  paths["/api/events/{id}/venue"]["patch"]["parameters"]["path"];
export type updateEventVenueBody =
  paths["/api/events/{id}/venue"]["patch"]["requestBody"]["content"]["application/json"];
export type updateEventVenueRes =
  paths["/api/events/{id}/venue"]["patch"]["responses"]["200"]["content"]["application/json"];

export type createVenueBody =
  paths["/api/venues"]["post"]["requestBody"]["content"]["application/json"];
export type createVenueRes =
  paths["/api/venues"]["post"]["responses"]["201"]["content"]["application/json"];

export type deleteVenuePath =
  paths["/api/venues/{venueId}"]["delete"]["parameters"]["path"];
export type deleteVenueRes =
  paths["/api/venues/{venueId}"]["delete"]["responses"]["200"]["content"]["application/json"];

export type BaseVenueDto = assignVenueRes["venue"];
export type UpdateVenueDto = assignVenueBody;
export type CreateVenueDto = createVenueBody;

export class getAllVenuesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllVenuesRes,
  getAllVenuesQuery
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
    this.setUrl("/venues/{venueId}").setMethod(RequestMethod.PATCH);
  }
}

// export class bulkAssignVenueBuilder extends RequestBuilder<
//   bulkAssignVenuePath,
//   bulkAssignVenueBody,
//   bulkAssignVenueRes
// > {
//   constructor() {
//     super();
//     this.setUrl("/venues/assign").setMethod(RequestMethod.POST);
//   }
// }
export class updateEventVenueBuilder extends RequestBuilder<
  updateEventVenuePath,
  updateEventVenueBody,
  updateEventVenueRes
> {
  constructor() {
    super();
    this.setUrl("/events/{id}/venue").setMethod(RequestMethod.PATCH);
  }
}

export class createVenueBuilder extends RequestBuilder<
  undefined,
  createVenueBody,
  createVenueRes
> {
  constructor() {
    super();
    this.setUrl("/venues").setMethod(RequestMethod.POST);
  }
}

export class deleteVenueBuilder extends RequestBuilder<
  deleteVenuePath,
  undefined,
  deleteVenueRes
> {
  constructor() {
    super();
    this.setUrl("/venues/{venueId}").setMethod(RequestMethod.DELETE);
  }
}
