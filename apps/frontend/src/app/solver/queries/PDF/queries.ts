import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  PDFjobLookupBody,
  PDFjobLookupBuilder,
  PDFjobStatusBuilder,
  PDFjobStatusParams,
  tempUploadPDFbody,
  uploadPDFBody,
  uploadPdfBuilder,
} from "./builder";

import {
  computePdfStreamFingerprint,
  type PdfStreamFingerprintResult,
  type Sha256Hash,
} from "shared-types";
import { createHash } from "node:crypto";

export function uploadPDF() {
  return mutationOptions({
    mutationFn: async (body: tempUploadPDFbody) => {
      const result = uploadPdfBuilder(body);
      return result;
      // this result will be used to set job id which will cause pollPDFresult to update
    },
  });
}

export function pollPdfResult(params: PDFjobStatusParams) {
  return queryOptions({
    queryKey: ["PDF", params.jobId],
    queryFn: async () => {
      const builder = new PDFjobStatusBuilder();
      const result = await builder.send({ paths: params });
      return result;
    },
    enabled: params.jobId != "",
    refetchInterval: 500,
  });
}

export function lookupPdfHash(body: PDFjobLookupBody) {
  return queryOptions({
    queryKey: ["PDF", body.pdfStreamHash],
    queryFn: async () => {
      console.log("Lookup ran");
      const builder = new PDFjobLookupBuilder();
      const result = await builder.send({ body: body });
      console.log(result);
      return result;
    },
    enabled: body.pdfStreamHash != "" && body.universityId != "",
    refetchInterval: 0,
  });
}

export async function fileHash(
  file: File,
): Promise<PdfStreamFingerprintResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = computePdfStreamFingerprint(bytes, createNodeSha256Hash());
  return result;
}

function createNodeSha256Hash(): Sha256Hash {
  const hash = createHash("sha256");
  return {
    update(input) {
      hash.update(input);
    },
    digestHex() {
      return hash.digest("hex");
    },
  };
}
