import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths } from "@/lib/api";

type createTimeTableBody =
  paths["/timetables"]["post"]["requestBody"]["content"]["application/json"];
type createTimeTableRes =
  paths["/timetables"]["post"]["responses"]["201"]["content"]["application/json"];

type getAllTimeTablesRes =
  paths["/timetables"]["get"]["responses"]["200"]["content"]["application/json"];

type getTTbyIdPath = paths["/timetables/{id}"]["get"]["parameters"]["path"];
type getTTbyIdRes =
  paths["/timetables/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

type updateTTbyIDPath =
  paths["/timetables/{id}"]["patch"]["parameters"]["path"];
type updateTTbyIDBody =
  paths["/timetables/{id}"]["patch"]["requestBody"]["content"]["application/json"];
type updateTTbyIDBodyRes =
  paths["/timetables/{id}"]["patch"]["responses"]["200"]["content"]["application/json"];

type deleteTTbyIDPath =
  paths["/timetables/{id}"]["delete"]["parameters"]["path"];

type deleteTTbyIDRes =
  paths["/timetables/{id}"]["delete"]["responses"]["200"]["content"]["application/json"];

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
