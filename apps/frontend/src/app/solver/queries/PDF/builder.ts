import { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

export type uploadPDF = paths["/pdf-parser/jobs/upload"]["post"];
export type uploadPDFBody =
  uploadPDF["requestBody"]["content"]["multipart/form-data"];
export type uploadPDFRes =
  uploadPDF["responses"]["202"]["content"]["application/json"];

export class uploadPDFbuilder extends RequestBuilder<
  undefined,
  uploadPDFBody,
  uploadPDFRes
> {
  constructor() {
    super();
    this.setUrl("/pdf-parser/jobs/upload").setMethod(RequestMethod.POST);
  }
}

export type PDFjobLookup = paths["/pdf-parser/jobs/lookup"]["post"];
export type PDFjobLookupBody =
  PDFjobLookup["requestBody"]["content"]["application/json"];
export type PDFjobLookupRes =
  PDFjobLookup["responses"]["200"]["content"]["application/json"];

// look for existing pdf result
export class PDFjobLookupBuilder extends RequestBuilder<
  undefined,
  PDFjobLookupBody,
  PDFjobLookupRes
> {
  constructor() {
    super();
    this.setUrl("/pdf-parser/jobs/lookup").setMethod(RequestMethod.POST);
  }
}

export type PDFjobStatus = paths["/pdf-parser/jobs/{jobId}"]["get"];
export type PDFjobStatusParams = PDFjobStatus["parameters"]["path"];

export type PDFjobStatusRes =
  PDFjobLookup["responses"]["200"]["content"]["application/json"];

// Polling, when status is complete check for the result using the module grouping id for a module lookup
export class PDFjobStatusBuilder extends RequestBuilder<
  PDFjobStatusParams,
  undefined,
  PDFjobStatusRes
> {
  constructor() {
    super();
    this.setUrl("/solver/jobs/{jobId}").setMethod(RequestMethod.POST);
  }
}
