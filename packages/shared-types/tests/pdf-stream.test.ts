import assert from "node:assert/strict";
import test from "node:test";
import { extractPdfStreamPayloads } from "../index.js";

const encoder = new TextEncoder();

test("extractPdfStreamPayloads ignores stream substrings without PDF keyword boundaries", () => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode("streaming\nbad\nendstreaming\n"),
  );

  assert.deepEqual(payloads, []);
});

test("extractPdfStreamPayloads reads delimited stream payloads", () => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode("1 0 obj\nstream\npayload\nendstream\nendobj\n"),
  );

  assert.equal(payloads.length, 1);
  assert.equal(new TextDecoder().decode(payloads[0]?.payload), "payload");
});
