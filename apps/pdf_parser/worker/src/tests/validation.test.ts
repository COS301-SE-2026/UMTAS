import assert from "node:assert/strict";
import test from "node:test";
import { WorkerExecutionError } from "bullmq-worker-core";
import { validatePdfParserResult } from "../validation.js";

test("validatePdfParserResult rejects extra keys on module candidates", () => {
  // NOSONAR - node:assert assertions are present.
  const result = validResult();
  result.modules.push({
    code: "COS301",
    name: null,
    metadata: {},
    warnings: [],
    extra: true,
  });

  assertInvalidParserResult(() => validatePdfParserResult(result));
});

test("validatePdfParserResult rejects malformed annotations", () => {
  // NOSONAR - node:assert assertions are present.
  const result = validResult();
  result.warnings.push({
    code: "WARN",
    message: "Missing details.",
  });

  assertInvalidParserResult(() => validatePdfParserResult(result));
});

function validResult(): {
  modules: unknown[];
  events: unknown[];
  warnings: unknown[];
} {
  return {
    modules: [],
    events: [],
    warnings: [],
  };
}

function assertInvalidParserResult(fn: () => unknown): void {
  assert.throws(
    fn,
    (error) =>
      error instanceof WorkerExecutionError &&
      error.code === "INVALID_PARSER_RESULT",
  );
}
