import test, { type TestContext } from "node:test";
import { parseCliJson, runCli } from "../run-cli.js";

test("runCli captures stdout and stderr without rejecting on exit failure", async (t: TestContext) => {
  const result = await runCli(process.execPath, [
    "-e",
    'process.stdout.write("out\\n"); process.stderr.write("err\\n"); process.exit(7);',
  ]);

  t.assert.equal(result.exitCode, 7);
  t.assert.equal(result.stdout, "out\n");
  t.assert.equal(result.stderr, "err\n");
  t.assert.equal(result.timedOut, false);
});

test("runCli kills a process that exceeds its timeout", async (t: TestContext) => {
  const startedAt = Date.now();

  const result = await runCli(
    process.execPath,
    ["-e", "setTimeout(() => {}, 1000)"],
    { timeoutMs: 50 },
  );

  t.assert.equal(result.timedOut, true);
  t.assert.notEqual(result.exitCode, 0);
  t.assert.ok(Date.now() - startedAt < 900);
});

test("runCli treats an aborted process as timed out", async (t: TestContext) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 50);

  const result = await runCli(
    process.execPath,
    ["-e", "setTimeout(() => {}, 1000)"],
    { abortSignal: controller.signal },
  );

  t.assert.equal(result.timedOut, true);
  t.assert.notEqual(result.exitCode, 0);
});

test("runCli rejects when the command cannot be spawned", async (t: TestContext) => {
  await t.assert.rejects(
    runCli("definitely-not-a-real-umtas-command", []),
    /ENOENT/,
  );
});

test("parseCliJson parses stdout as JSON", (t: TestContext) => {
  const parsed = parseCliJson<{ ok: boolean }>({
    exitCode: 0,
    stdout: '{"ok":true}',
    stderr: "",
    timedOut: false,
  });

  t.assert.deepEqual(parsed, { ok: true });
});

test("parseCliJson reports invalid JSON output", (t: TestContext) => {
  t.assert.throws(
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
