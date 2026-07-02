import assert from "node:assert/strict";
import test from "node:test";
import { HttpCallbackClient } from "../callback-client.js";

test("HttpCallbackClient retries failed callback posts with backoff", async () => {
  const delays: number[] = [];
  let calls = 0;
  const client = new HttpCallbackClient({
    token: "worker-token",
    maxAttempts: 3,
    initialDelayMs: 10,
    sleep: async (delayMs) => {
      delays.push(delayMs);
    },
    fetchFn: async (_url, init) => {
      calls += 1;
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.authorization, "Bearer worker-token");
      assert.equal(headers["content-type"], "application/json");

      if (calls < 3) {
        return {
          ok: false,
          status: 503,
          text: async () => "temporarily unavailable",
        };
      }

      return { ok: true, status: 202, text: async () => "" };
    },
  });

  await client.post("http://backend.test/jobs/abc/callback", {
    status: "completed",
    result: { ok: true },
  });

  assert.equal(calls, 3);
  assert.deepEqual(delays, [10, 20]);
});
