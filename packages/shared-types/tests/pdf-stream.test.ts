import { createHash } from "node:crypto";
import test, { type TestContext } from "node:test";
import {
  computePdfStreamFingerprint,
  extractPdfStreamPayloads,
} from "../src/index.js";

const encoder = new TextEncoder();

test("computePdfStreamFingerprint reports no usable streams", (t) => {
  const hash = {
    update() {
      throw new Error("update should not be called");
    },
    digestHex() {
      throw new Error("digestHex should not be called");
    },
  };

  const result = computePdfStreamFingerprint(
    encoder.encode("not a PDF stream"),
    hash,
  );

  t.assert.deepEqual(result, {
    ok: false,
    streamCount: 0,
    algorithmVersion: "pdf-stream-payload-sha256-v1",
    reason: "NO_STREAMS_FOUND",
  });
});

for (const lineEnding of ["\r\n", "\n", "\r"]) {
  test(`computePdfStreamFingerprint supports ${JSON.stringify(lineEnding)} line endings`, (t) => {
    const result = fingerprint(
      `1 0 obj${lineEnding}<< /Length 7 >>${lineEnding}stream${lineEnding}payload${lineEnding}endstream${lineEnding}endobj`,
    );

    t.assert.deepEqual(result, {
      ok: true,
      hash: expectedHash(["payload"]),
      streamCount: 1,
      algorithmVersion: "pdf-stream-payload-sha256-v1",
    });
  });
}

test("computePdfStreamFingerprint hashes multiple streams in file order with length separators", (t) => {
  const result = fingerprint(
    "%PDF-1.7\n1 0 obj\n<< /Length 2 >>\nstream\nab\nendstream\nendobj\n2 0 obj\n<< /Length 1 >>\nstream\nc\nendstream\nendobj\n",
  );

  t.assert.equal(result.ok && result.hash, expectedHash(["ab", "c"]));
  t.assert.notEqual(expectedHash(["ab", "c"]), expectedHash(["a", "bc"]));
});

test("computePdfStreamFingerprint ignores changes outside stream payloads", (t) => {
  const first = fingerprint(
    "%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\ntrailer <</ID [<one>]>> /CreationDate (A)",
  );
  const second = fingerprint(
    "%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\ntrailer <</ID [<two>]>> /CreationDate (B)",
  );

  t.assert.equal(first.ok && first.hash, second.ok && second.hash);
});

test("computePdfStreamFingerprint changes when stream payload bytes change", (t) => {
  const first = fingerprint(
    "%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\n",
  );
  const second = fingerprint(
    "%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\nchanged\nendstream\nendobj\n",
  );

  t.assert.notEqual(first.ok && first.hash, second.ok && second.hash);
});

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

function fingerprint(value: string) {
  const hash = createHash("sha256");
  return computePdfStreamFingerprint(encoder.encode(value), {
    update(input) {
      hash.update(input);
    },
    digestHex() {
      return hash.digest("hex");
    },
  });
}

function expectedHash(payloads: string[]): string {
  const hash = createHash("sha256");
  for (const payload of payloads) {
    const payloadBytes = encoder.encode(payload);
    hash.update(encodeUint64BigEndian(payloadBytes.byteLength));
    hash.update(payloadBytes);
  }

  return hash.digest("hex");
}

function encodeUint64BigEndian(value: number): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value));
  return bytes;
}
