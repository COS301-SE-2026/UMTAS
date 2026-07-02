import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const mode = process.argv[2] ?? "echo";
const stateFile = process.argv[3];
const startNumber = recordStart();

process.on("SIGTERM", () => {
  if (mode === "ignore-sigterm") {
    return;
  }

  process.exit(0);
});

if (mode === "ignore-sigterm") {
  setInterval(() => {}, 1_000);
}

const input = createInterface({ input: process.stdin });
input.on("line", (line) => {
  const request = JSON.parse(line) as { requestId: string };

  if (mode === "hang") {
    return;
  }

  if (mode === "malformed-once" && startNumber === 1) {
    process.stdout.write("null\n");
    return;
  }

  if (mode === "failed-invalid-once" && startNumber === 1) {
    process.stdout.write(
      `${JSON.stringify({
        requestId: request.requestId,
        status: "failed",
      })}\n`,
    );
    return;
  }

  writeCompletedResponse(request.requestId);
});

function writeCompletedResponse(requestId: string): void {
  process.stdout.write(
    `${JSON.stringify({
      requestId,
      status: "completed",
      result: {
        modules: [],
        events: [],
        warnings: [
          {
            code: "PID",
            message: "Parser fixture process id.",
            details: { pid: process.pid },
          },
        ],
      },
    })}\n`,
  );
}

function recordStart(): number {
  if (!stateFile) {
    return 1;
  }

  const state = readState();
  state.starts += 1;
  state.pid = process.pid;
  writeFileSync(stateFile, JSON.stringify(state));
  return state.starts;
}

function readState(): { starts: number; pid: number | undefined } {
  if (!stateFile) {
    return { starts: 0, pid: undefined };
  }

  try {
    return JSON.parse(readFileSync(stateFile, "utf8")) as {
      starts: number;
      pid: number | undefined;
    };
  } catch {
    return { starts: 0, pid: undefined };
  }
}
