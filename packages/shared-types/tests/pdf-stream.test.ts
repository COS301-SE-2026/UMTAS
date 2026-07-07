import test, { type TestContext } from "node:test";
import { extractPdfStreamPayloads } from "../index.js";

const encoder = new TextEncoder();

test("extractPdfStreamPayloads ignores stream substrings outside PDF objects", (t: TestContext) => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode("streaming\nbad\nendstreaming\n"),
  );

  t.assert.deepEqual(payloads, []);
});

test("extractPdfStreamPayloads reads object stream payloads by direct Length", (t: TestContext) => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode(
      "1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\n",
    ),
  );

  t.assert.equal(payloads.length, 1);
  t.assert.equal(new TextDecoder().decode(payloads[0]?.payload), "payload");
});

test("extractPdfStreamPayloads rejects streams whose Length does not reach endstream", (t: TestContext) => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode(
      "1 0 obj\n<< /Length 3 >>\nstream\npayload\nendstream\nendobj\n",
    ),
  );

  t.assert.deepEqual(payloads, []);
});

test("extractPdfStreamPayloads ignores indirect Length objects", (t: TestContext) => {
  const payloads = extractPdfStreamPayloads(
    encoder.encode(
      "1 0 obj\n<< /Length 2 0 R >>\nstream\npayload\nendstream\nendobj\n",
    ),
  );

  t.assert.deepEqual(payloads, []);
});
