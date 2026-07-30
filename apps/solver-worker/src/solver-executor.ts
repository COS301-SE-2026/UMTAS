import { readFile } from "node:fs/promises";
import {
  runCli,
  WorkerExecutionError,
  type CliResult,
} from "bullmq-worker-core";
import {
  SolverCliOutputSchema,
  SolverResultSchema,
  type SolverCliOutput,
  type SolverResult,
} from "shared-types";
import type {
  SolveRequest,
  SolverExecutor,
  SolverRunOutcome,
} from "./contracts.js";

export type RunCliFn = typeof runCli;

export interface CliSolverExecutorOptions {
  command: string;
  args: string[];
  cwd?: string;
  runCliFn?: RunCliFn;
  readOutputFile?: (path: string) => Promise<string>;
}

/**
 * CLI protocol: --input <JSON path> --output <JSON path> --engine <cp-sat|ga>
 * --solve-mode <feasibility|optimization>.
 * A feasible output contains a timetableSolution and optional heuristic scores; an
 * infeasible output is exactly { "status": "infeasible" }.
 */
export class CliSolverExecutor implements SolverExecutor {
  private readonly command: string;
  private readonly args: string[];
  private readonly cwd: string | undefined;
  private readonly runCliFn: RunCliFn;
  private readonly readOutputFile: (path: string) => Promise<string>;

  constructor(options: CliSolverExecutorOptions) {
    this.command = options.command;
    this.args = options.args;
    this.cwd = options.cwd;
    this.runCliFn = options.runCliFn ?? runCli;
    this.readOutputFile =
      options.readOutputFile ??
      (async (filePath: string) => readFile(filePath, "utf8"));
  }

  async solve(request: SolveRequest): Promise<SolverRunOutcome> {
    const options: { abortSignal: AbortSignal; cwd?: string } = {
      abortSignal: request.abortSignal,
    };
    if (this.cwd) options.cwd = this.cwd;

    const execution = await this.runCliFn(
      this.command,
      this.buildArgs(request),
      options,
    );
    assertSuccessfulExecution(execution);

    let output: unknown;
    try {
      output = JSON.parse(await this.readOutputFile(request.outputPath));
    } catch (error) {
      throw new WorkerExecutionError(
        "SOLVER_PROTOCOL_ERROR",
        "Solver output was not valid JSON.",
        {
          stderr: execution.stderr,
          cause: error instanceof Error ? error.message : String(error),
        },
      );
    }

    const parsed = SolverCliOutputSchema.safeParse(output);
    if (!parsed.success) {
      throw new WorkerExecutionError(
        "SOLVER_PROTOCOL_ERROR",
        "Solver output did not match the CLI contract.",
        {
          stderr: execution.stderr,
          issues: parsed.error.issues,
        },
      );
    }

    if (parsed.data.status === "infeasible") return { status: "infeasible" };

    return {
      status: "feasible",
      result: toSolverResult(parsed.data, request.engine),
    };
  }

  private buildArgs(request: SolveRequest): string[] {
    const args = this.args.slice();
    args.push("--input", request.inputPath);
    args.push("--output", request.outputPath);
    args.push("--engine", request.engine);
    args.push("--solve-mode", request.solveMode);
    return args;
  }
}

function assertSuccessfulExecution(result: CliResult): void {
  if (result.timedOut) {
    throw new WorkerExecutionError("SOLVER_TIMEOUT", "Solver CLI timed out.", {
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  }

  if (result.exitCode !== 0) {
    throw new WorkerExecutionError("SOLVER_CLI_FAILED", "Solver CLI failed.", {
      stderr: result.stderr,
      stdout: result.stdout,
      exitCode: result.exitCode,
    });
  }
}

function toSolverResult(
  output: Extract<SolverCliOutput, { status: "feasible" }>,
  engine: "cp-sat" | "ga",
): SolverResult {
  return SolverResultSchema.parse({
    engine,
    outcome: output.outcome,
    timetableSolution: output.timetableSolution,
    heuristicScores: output.heuristicScores,
    metadata: output.metadata,
  });
}
