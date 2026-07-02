import assert from "node:assert/strict";
import test from "node:test";
import { parseCliJson, runCli } from "../run-cli.js";

test("runCli captures stdout and stderr without rejecting on exit failure", async () => {
  const result = await runCli(process.execPath, [
    "-e",
    'process.stdout.write("out\\n"); process.stderr.write("err\\n"); process.exit(7);',
  ]);

  assert.equal(result.exitCode, 7);
  assert.equal(result.stdout, "out\n");
  assert.equal(result.stderr, "err\n");
  assert.equal(result.timedOut, false);
});

test("runCli kills a process that exceeds its timeout", async () => {
  const startedAt = Date.now();

  const result = await runCli(
    process.execPath,
    ["-e", "setTimeout(() => {}, 1000)"],
    { timeoutMs: 50 },
  );

  assert.equal(result.timedOut, true);
  assert.notEqual(result.exitCode, 0);
  assert.ok(Date.now() - startedAt < 900);
});

test("runCli treats an aborted process as timed out", async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 50);

  const result = await runCli(
    process.execPath,
    ["-e", "setTimeout(() => {}, 1000)"],
    { abortSignal: controller.signal },
  );

  assert.equal(result.timedOut, true);
  assert.notEqual(result.exitCode, 0);
});

test("runCli rejects when the command cannot be spawned", async () => {
  await assert.rejects(
    runCli("definitely-not-a-real-umtas-command", []),
    /ENOENT/,
  );
});

test("parseCliJson parses stdout as JSON", () => {
  const parsed = parseCliJson<{ ok: boolean }>({
    exitCode: 0,
    stdout: '{"ok":true}',
    stderr: "",
    timedOut: false,
  });

  assert.deepEqual(parsed, { ok: true });
});

test("parseCliJson reports invalid JSON output", () => {
  assert.throws(
    () =>
      parseCliJson({
        exitCode: 0,
        stdout: "not-json",
        stderr: "",
        timedOut: false,
      }),
    /CLI stdout was not valid JSON/,
  );
});
