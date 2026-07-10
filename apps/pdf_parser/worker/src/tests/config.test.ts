import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPdfParseWorkerConfig,
  readArgs,
  validatePdfParseWorkerConfig,
} from "../config.js";

test("buildPdfParseWorkerConfig uses CLI parser settings", () => {
  // NOSONAR - node:assert assertions are present.
  const config = buildPdfParseWorkerConfig(() => undefined);

  assert.deepEqual(config.cliArgs, ["-m", "parser_cli"]);
});

test("readArgs accepts JSON string arrays for arguments with spaces", () => {
  // NOSONAR - node:assert assertions are present.
  assert.deepEqual(readArgs('["-m","parser_cli","--label","UP 2026"]', []), [
    "-m",
    "parser_cli",
    "--label",
    "UP 2026",
  ]);
});

test("validatePdfParseWorkerConfig requires callback token at startup", () => {
  // NOSONAR - node:assert assertions are present.
  const config = buildPdfParseWorkerConfig((key) => {
    if (key === "MINIO_BUCKET") {
      return "umtas-uploads";
    }

    if (key === "WORKER_CALLBACK_TOKEN") {
      return "  ";
    }

    return undefined;
  });

  assert.throws(
    () => validatePdfParseWorkerConfig(config),
    /WORKER_CALLBACK_TOKEN is required/,
  );
});
