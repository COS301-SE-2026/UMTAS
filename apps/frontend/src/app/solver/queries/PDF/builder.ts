import { paths } from "@/lib/api";
import {
  ApiPath,
  createUrl,
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";
import { UserDetails } from "@/lib/userclass/userClass";

export type uploadPDF = paths["/api/pdf-parser/jobs/upload"]["post"];
export type uploadPDFBody =
  uploadPDF["requestBody"]["content"]["multipart/form-data"];
export type tempUploadPDFbody = {
  file: File | Blob;
  adapterKey?: string;
  universityId: string;
  fingerprintAlgorithm?: string;
  clientPdfStreamHash?: string;
  streamCount?: number;
};

export type uploadPDFRes =
  uploadPDF["responses"]["202"]["content"]["application/json"];

export async function uploadPdfBuilder(
  body: tempUploadPDFbody,
): Promise<uploadPDFRes> {
  if (!body.file) throw new Error("No file selected");

  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

  const formData = new FormData();
  formData.append("file", body.file);
  formData.append("adapterKey", "up");
  formData.append(
    "universityId",
    UserDetails.getUniDetails()?.UniversityID || "",
  );
  formData.append("fingerprintAlgorithm", "pdf-stream-payload-sha256-v1");

  const path: ApiPath = "/pdf-parser/jobs/upload";

  const res = await fetch(createUrl(path), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export type PDFjobLookup = paths["/api/pdf-parser/jobs/lookup"]["post"];
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

export type PDFjobStatus = paths["/api/pdf-parser/jobs/{jobId}"]["get"];
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
    this.setUrl("/pdf-parser/jobs/{jobId}").setMethod(RequestMethod.GET);
  }
}
