import assert from "node:assert/strict";
import test from "node:test";
import { buildPdfParseWorkerConfig, readArgs } from "../config.js";

test("buildPdfParseWorkerConfig defaults to CLI execution", () => {
  const config = buildPdfParseWorkerConfig(() => undefined);

  assert.equal(config.executionMode, "cli");
  assert.deepEqual(config.cliArgs, ["-m", "parser_cli"]);
  assert.deepEqual(config.workerArgs, ["-m", "parser_worker"]);
});

test("readArgs accepts JSON string arrays for arguments with spaces", () => {
  assert.deepEqual(readArgs('["-m","parser_cli","--label","UP 2026"]', []), [
    "-m",
    "parser_cli",
    "--label",
    "UP 2026",
  ]);
});
