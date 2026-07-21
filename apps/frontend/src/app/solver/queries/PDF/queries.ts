import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  PDFjobLookupBody,
  PDFjobLookupBuilder,
  PDFjobStatusBuilder,
  PDFjobStatusParams,
  uploadPDFBody,
  uploadPDFbuilder,
} from "./builder";

export function uploadPDF(body: uploadPDFBody) {
  return mutationOptions({
    mutationFn: async () => {
      const builder = new uploadPDFbuilder();
      const result = await builder.send({ body: body });
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
  });
}

export function lookupPdfHash(body: PDFjobLookupBody) {
  return queryOptions({
    queryKey: ["PDF", body.pdfStreamHash],
    queryFn: async () => {
      const builder = new PDFjobLookupBuilder();
      const result = await builder.send({ body: body });
      return result;
    },
  });
}

export function fileHash() {}
