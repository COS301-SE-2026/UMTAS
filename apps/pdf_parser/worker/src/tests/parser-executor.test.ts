import assert from "node:assert/strict";
import test from "node:test";
import { WorkerExecutionError } from "bullmq-worker-core";
import { CliParserExecutor } from "../parser-executor.js";

const parserResult = {
  modules: [],
  events: [],
  warnings: [],
};

test("CliParserExecutor appends adapter and file arguments to the configured command", async () => {
  // NOSONAR - node:assert assertions are present.
  const executor = new CliParserExecutor({
    command: "python3",
    args: ["-m", "parser_cli"],
    cwd: "/app/apps/pdf_parser",
    runCliFn: async (command, args, options) => {
      assert.equal(command, "python3");
      assert.deepEqual(args, [
        "-m",
        "parser_cli",
        "--adapter",
        "up",
        "--file",
        "/tmp/input.pdf",
      ]);
      assert.ok(options);
      assert.equal(options.cwd, "/app/apps/pdf_parser");
      return {
        exitCode: 0,
        stdout: JSON.stringify(parserResult),
        stderr: "",
        timedOut: false,
      };
    },
  });

  const result = await executor.parsePdf({
    requestId: "parse-1",
    adapterKey: "up",
    filePath: "/tmp/input.pdf",
    abortSignal: new AbortController().signal,
  });

  assert.deepEqual(result, parserResult);
});

test("CliParserExecutor converts structured parser failures to worker execution errors", async () => {
  // NOSONAR - node:assert assertions are present.
  const executor = new CliParserExecutor({
    command: "python3",
    args: ["-m", "parser_cli"],
    runCliFn: async () => ({
      exitCode: 2,
      stdout: JSON.stringify({
        code: "UNKNOWN_ADAPTER",
        message: "No parser adapter is registered.",
        details: { adapterKey: "bad" },
      }),
      stderr: "diagnostic",
      timedOut: false,
    }),
  });

  await assert.rejects(
    () =>
      executor.parsePdf({
        requestId: "parse-1",
        adapterKey: "bad",
        filePath: "/tmp/input.pdf",
        abortSignal: new AbortController().signal,
      }),
    (error) =>
      error instanceof WorkerExecutionError &&
      error.code === "UNKNOWN_ADAPTER" &&
      error.details.stderr === "diagnostic" &&
      assert.deepEqual(error.details.parserDetails, { adapterKey: "bad" }) ===
        undefined,
  );
});

test("CliParserExecutor keeps parser details from overwriting worker error metadata", async () => {
  // NOSONAR - node:assert assertions are present.
  const executor = new CliParserExecutor({
    command: "python3",
    args: ["-m", "parser_cli"],
    runCliFn: async () => ({
      exitCode: 2,
      stdout: JSON.stringify({
        code: "PARSER_FAILED",
        message: "Parser failed.",
        details: {
          stderr: "parser stderr field",
          exitCode: 0,
          reason: "bad pdf",
        },
      }),
      stderr: "real stderr",
      timedOut: false,
    }),
  });

  await assert.rejects(
    () =>
      executor.parsePdf({
        requestId: "parse-1",
        adapterKey: "up",
        filePath: "/tmp/input.pdf",
        abortSignal: new AbortController().signal,
      }),
    (error) =>
      error instanceof WorkerExecutionError &&
      error.details.stderr === "real stderr" &&
      error.details.exitCode === 2 &&
      assert.deepEqual(error.details.parserDetails, {
        stderr: "parser stderr field",
        exitCode: 0,
        reason: "bad pdf",
      }) === undefined,
  );
});
