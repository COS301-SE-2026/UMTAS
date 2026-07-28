import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths } from "@/lib/api";

export type createTimeTableBody =
  paths["/api/timetables"]["post"]["requestBody"]["content"]["application/json"];
export type createTimeTableRes =
  paths["/api/timetables"]["post"]["responses"]["201"]["content"]["application/json"];

export type getAllTimeTablesRes =
  paths["/api/timetables"]["get"]["responses"]["200"]["content"]["application/json"];

export type TimetableResponse = getAllTimeTablesRes["timetables"][number];

type getTTbyIdPath = paths["/api/timetables/{id}"]["get"]["parameters"]["path"];
type getTTbyIdRes =
  paths["/api/timetables/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type updateTTbyIDPath =
  paths["/api/timetables/{id}"]["patch"]["parameters"]["path"];
export type updateTTbyIDBody =
  paths["/api/timetables/{id}"]["patch"]["requestBody"]["content"]["application/json"];
type updateTTbyIDBodyRes =
  paths["/api/timetables/{id}"]["patch"]["responses"]["200"]["content"]["application/json"];

export type deleteTTbyIDPath =
  paths["/api/timetables/{id}"]["delete"]["parameters"]["path"];

type deleteTTbyIDRes =
  paths["/api/timetables/{id}"]["delete"]["responses"]["200"]["content"]["application/json"];

export class createTimeTableBuilder extends RequestBuilder<
  undefined,
  createTimeTableBody,
  createTimeTableRes
> {
  constructor() {
    super();
    this.setUrl("/timetables").setMethod(RequestMethod.POST);
  }
}

export class getAllTimeTablesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllTimeTablesRes
> {
  constructor() {
    super();
    this.setUrl("/timetables").setMethod(RequestMethod.GET);
  }
}

export class getTTbyIdBuilder extends RequestBuilder<
  getTTbyIdPath,
  undefined,
  getTTbyIdRes
> {
  constructor() {
    super();
    this.setUrl("/timetables/{id}").setMethod(RequestMethod.GET);
  }
}

export class updateTTbyIDBuilder extends RequestBuilder<
  updateTTbyIDPath,
  updateTTbyIDBody,
  updateTTbyIDBodyRes
> {
  constructor() {
    super();
    this.setUrl("/timetables/{id}").setMethod(RequestMethod.PATCH);
  }
}

export class deleteTTbyIDBuilder extends RequestBuilder<
  deleteTTbyIDPath,
  undefined,
  deleteTTbyIDRes
> {
  constructor() {
    super();
    this.setUrl("/timetables/{id}").setMethod(RequestMethod.DELETE);
  }
}
