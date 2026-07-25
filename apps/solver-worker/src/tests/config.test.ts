import assert from "node:assert/strict";
import test from "node:test";
import { buildSolverCallbackUrl } from "../config.js";

test("solver callback URLs identify the queued attempt", () => {
  assert.equal(
    buildSolverCallbackUrl(
      "http://backend.test/",
      "solve-1",
      "11111111-1111-4111-8111-111111111111",
    ),
    "http://backend.test/solver/jobs/solve-1/callback?attemptToken=11111111-1111-4111-8111-111111111111",
  );
});
