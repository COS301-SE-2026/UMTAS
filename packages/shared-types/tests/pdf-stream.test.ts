import assert from "node:assert/strict";
import test from "node:test";
import { extractPdfStreamPayloads } from "../index.js";

const encoder = new TextEncoder();

test("extractPdfStreamPayloads ignores stream substrings outside PDF objects", () => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode("streaming\nbad\nendstreaming\n"),
  );

  assert.deepEqual(payloads, []);
});

test("extractPdfStreamPayloads reads object stream payloads by direct Length", () => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode(
      "1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\n",
    ),
  );

  assert.equal(payloads.length, 1);
  assert.equal(new TextDecoder().decode(payloads[0]?.payload), "payload");
});

test("extractPdfStreamPayloads rejects streams whose Length does not reach endstream", () => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode(
      "1 0 obj\n<< /Length 3 >>\nstream\npayload\nendstream\nendobj\n",
    ),
  );

  assert.deepEqual(payloads, []);
});

test("extractPdfStreamPayloads ignores indirect Length objects", () => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode(
      "1 0 obj\n<< /Length 2 0 R >>\nstream\npayload\nendstream\nendobj\n",
    ),
  );

  assert.deepEqual(payloads, []);
});
