import assert from "node:assert/strict";
import test from "node:test";
import { buildPdfParseWorkerConfig, readArgs } from "../config.js";

test("buildPdfParseWorkerConfig uses CLI parser settings", () => {
  const config = buildPdfParseWorkerConfig(() => undefined);

  assert.deepEqual(config.cliArgs, ["-m", "parser_cli"]);
});

test("readArgs accepts JSON string arrays for arguments with spaces", () => {
  assert.deepEqual(readArgs('["-m","parser_cli","--label","UP 2026"]', []), [
    "-m",
    "parser_cli",
    "--label",
    "UP 2026",
  ]);
});
