import { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";
import { UserDetails } from "@/lib/userclass/userClass";

export type uploadPDF = paths["/pdf-parser/jobs/upload"]["post"];
export type uploadPDFBody =
  uploadPDF["requestBody"]["content"]["multipart/form-data"];
export type uploadPDFRes =
  uploadPDF["responses"]["202"]["content"]["application/json"];

export async function uploadPdfBuilder(
  body: uploadPDFBody,
): Promise<uploadPDFRes> {
  if (!body.file) throw new Error("No file selected");

  const formData = new FormData();
  formData.append("file", body.file);
  formData.append("adapterKey", "up");
  formData.append(
    "universityId",
    UserDetails.getUniDetails()?.UniversityID || "",
  );
  formData.append("fingerprintAlgorithm", "pdf-stream-payload-sha256-v1");

  const res = await fetch("/pdf-parser/jobs/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
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
