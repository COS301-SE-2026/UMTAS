import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { WorkerExecutionError } from "bullmq-worker-core";
import type { PdfParserResult } from "shared-types";
import { ParserProcessPool } from "../parser-process-pool.js";

const fixturePath = fileURLToPath(
  new URL("./parser-child-fixture.js", import.meta.url),
);

test("ParserProcessPool rejects malformed child responses and restarts the child", async () => {
  const fixture = await createPool("malformed-once");

  try {
    await assert.rejects(
      () => parsePdf(fixture.pool, "parse-1"),
      isProtocolError,
    );

    const result = await parsePdf(fixture.pool, "parse-2");
    assert.ok(getPid(result) > 0);
  } finally {
    await fixture.pool.close();
  }
});

test("ParserProcessPool rejects failed responses with invalid shape", async () => {
  const fixture = await createPool("failed-invalid-once");

  try {
    await assert.rejects(
      () => parsePdf(fixture.pool, "parse-1"),
      isProtocolError,
    );

    const result = await parsePdf(fixture.pool, "parse-2");
    assert.ok(getPid(result) > 0);
  } finally {
    await fixture.pool.close();
  }
});

test("ParserProcessPool rejects active jobs when the request is aborted", async () => {
  const fixture = await createPool("hang");
  const controller = new AbortController();

  try {
    const resultPromise = parsePdf(fixture.pool, "parse-1", controller.signal);
    controller.abort();

    await assert.rejects(
      () => resultPromise,
      (error) =>
        error instanceof WorkerExecutionError &&
        error.code === "PARSER_TIMEOUT",
    );
  } finally {
    await fixture.pool.close();
  }
});

test("ParserProcessPool restarts a child after maxJobsPerProcess", async () => {
  const fixture = await createPool("echo", 1);

  try {
    const firstResult = await parsePdf(fixture.pool, "parse-1");
    const secondResult = await parsePdf(fixture.pool, "parse-2");

    assert.notEqual(getPid(firstResult), getPid(secondResult));
  } finally {
    await fixture.pool.close();
  }
});

test("ParserProcessPool SIGKILLs a child that ignores SIGTERM during shutdown", async () => {
  const fixture = await createPool("ignore-sigterm");
  const pid = await waitForPid(fixture.stateFile);

  try {
    await fixture.pool.close();
    assert.equal(await isProcessRunning(pid), false);
  } finally {
    if (await isProcessRunning(pid)) {
      process.kill(pid, "SIGKILL");
    }
  }
});

async function createPool(
  mode: string,
  maxJobsPerProcess = 10,
): Promise<PoolFixture> {
  const directory = await mkdtemp(join(tmpdir(), "parser-pool-test-"));
  const stateFile = join(directory, "state.json");
  const pool = new ParserProcessPool({
    size: 1,
    command: process.execPath,
    args: [fixturePath, mode, stateFile],
    maxJobsPerProcess,
  });

  return { pool, stateFile };
}

interface PoolFixture {
  pool: ParserProcessPool;
  stateFile: string;
}

function parsePdf(
  pool: ParserProcessPool,
  requestId: string,
  abortSignal = new AbortController().signal,
): Promise<PdfParserResult> {
  return pool.parsePdf({
    requestId,
    adapterKey: "up",
    filePath: "/tmp/input.pdf",
    abortSignal,
  });
}

function isProtocolError(error: unknown): boolean {
  return (
    error instanceof WorkerExecutionError &&
    error.code === "PARSER_PROTOCOL_ERROR"
  );
}

function getPid(result: PdfParserResult): number {
  const pid = result.warnings[0]?.details.pid;
  if (typeof pid !== "number") {
    throw new Error("Parser result did not include a fixture pid.");
  }

  return pid;
}

async function waitForPid(stateFile: string): Promise<number> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await readState(stateFile);
    if (typeof state.pid === "number") {
      return state.pid;
    }
    await sleep(25);
  }

  throw new Error("Timed out waiting for parser fixture pid.");
}

async function readState(
  stateFile: string,
): Promise<{ starts?: number; pid?: number }> {
  try {
    return JSON.parse(await readFile(stateFile, "utf8")) as {
      starts?: number;
      pid?: number;
    };
  } catch {
    return {};
  }
}

async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
