import assert from "node:assert/strict";
import test from "node:test";
import {
  processWorkerJob,
  WorkerExecutionError,
  type WorkerCallbackPayload,
} from "../index.js";

test("processWorkerJob cleans temp files after an acknowledged success callback", async () => {
  let cleanupCalled = false;
  let callbackSawTempBeforeCleanup = false;
  const payload: WorkerCallbackPayload = {
    status: "completed",
    result: { parsed: true },
  };

  const result = await processWorkerJob(
    {
      id: "parse-1",
      data: { jobId: "parse-1" },
      attemptsMade: 0,
      opts: { attempts: 3 },
    },
    {
      timeoutMs: 1_000,
      keepFailedTemp: false,
      callbackUrl: "http://backend.test/callback",
      createTempDir: async () => "/tmp/umtas-parse-1",
      cleanupTempDir: async (tempDir) => {
        assert.equal(tempDir, "/tmp/umtas-parse-1");
        cleanupCalled = true;
      },
      callbackClient: {
        post: async (_url, postedPayload) => {
          assert.deepEqual(postedPayload, payload);
          callbackSawTempBeforeCleanup = !cleanupCalled;
        },
      },
      processor: {
        process: async (context) => {
          assert.equal(context.tempDir, "/tmp/umtas-parse-1");
          return payload;
        },
      },
    },
  );

  assert.deepEqual(result, payload);
  assert.equal(callbackSawTempBeforeCleanup, true);
  assert.equal(cleanupCalled, true);
});

test("processWorkerJob sends final failure callbacks and preserves failed temp dirs when configured", async () => {
  let cleanupCalled = false;
  let failureCallback: WorkerCallbackPayload | undefined;

  await assert.rejects(
    () =>
      processWorkerJob(
        {
          id: "parse-2",
          data: { jobId: "parse-2" },
          attemptsMade: 2,
          opts: { attempts: 3 },
        },
        {
          timeoutMs: 1_000,
          keepFailedTemp: true,
          callbackUrl: "http://backend.test/callback",
          createTempDir: async () => "/tmp/umtas-parse-2",
          cleanupTempDir: async () => {
            cleanupCalled = true;
          },
          callbackClient: {
            post: async (_url, postedPayload) => {
              failureCallback = postedPayload;
            },
          },
          processor: {
            process: async () => {
              throw new WorkerExecutionError("PARSER_FAILED", "Parser failed", {
                stderr: "bad pdf",
              });
            },
          },
        },
      ),
    /Parser failed/,
  );

  assert.equal(cleanupCalled, false);
  assert.deepEqual(failureCallback, {
    status: "failed",
    error: {
      code: "PARSER_FAILED",
      message: "Parser failed",
      details: { stderr: "bad pdf" },
    },
  });
});

test("processWorkerJob does not send callback delivery failures before final attempt", async () => {
  const postedPayloads: WorkerCallbackPayload[] = [];
  const payload: WorkerCallbackPayload = {
    status: "completed",
    result: { parsed: true },
  };

  await assert.rejects(
    () =>
      processWorkerJob(
        {
          id: "parse-3",
          data: { jobId: "parse-3" },
          attemptsMade: 1,
          opts: { attempts: 3 },
        },
        {
          timeoutMs: 1_000,
          keepFailedTemp: false,
          callbackUrl: "http://backend.test/callback",
          createTempDir: async () => "/tmp/umtas-parse-3",
          cleanupTempDir: async () => {},
          callbackClient: {
            post: async (_url, postedPayload) => {
              postedPayloads.push(postedPayload);
              throw new Error("backend unavailable");
            },
          },
          processor: {
            process: async () => payload,
          },
        },
      ),
    /backend unavailable/,
  );

  assert.deepEqual(postedPayloads, [payload]);
});

test("processWorkerJob sends callback delivery failure on final success callback failure", async () => {
  const postedPayloads: WorkerCallbackPayload[] = [];
  const payload: WorkerCallbackPayload = {
    status: "completed",
    result: { parsed: true },
  };

  await assert.rejects(
    () =>
      processWorkerJob(
        {
          id: "parse-4",
          data: { jobId: "parse-4" },
          attemptsMade: 2,
          opts: { attempts: 3 },
        },
        {
          timeoutMs: 1_000,
          keepFailedTemp: false,
          callbackUrl: "http://backend.test/callback",
          createTempDir: async () => "/tmp/umtas-parse-4",
          cleanupTempDir: async () => {},
          callbackClient: {
            post: async (_url, postedPayload) => {
              postedPayloads.push(postedPayload);
              if (postedPayload.status === "completed") {
                throw new Error("backend rejected success callback");
              }
            },
          },
          processor: {
            process: async () => payload,
          },
        },
      ),
    /backend rejected success callback/,
  );

  assert.deepEqual(postedPayloads, [
    payload,
    {
      status: "failed",
      error: {
        code: "WORKER_CALLBACK_DELIVERY_FAILED",
        message:
          "Worker completed parsing but could not deliver success callback",
        details: {
          cause: "backend rejected success callback",
        },
      },
    },
  ]);
});
