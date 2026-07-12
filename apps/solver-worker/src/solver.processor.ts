import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  WorkerExecutionError,
  type WorkerCallbackPayload,
  type WorkerJobContext,
  type WorkerProcessor,
} from "bullmq-worker-core";
import {
  TimetableSolveJobDataSchema,
  type TimetableSolveJobData,
} from "shared-types";
import type { SolverExecutor, SolverInputClient } from "./contracts.js";

export interface SolverProcessorOptions {
  inputClient: SolverInputClient;
  solverExecutor: SolverExecutor;
  writeInputFile?: (path: string, content: string) => Promise<void>;
}

export class SolverProcessor implements WorkerProcessor<TimetableSolveJobData> {
  private readonly inputClient: SolverInputClient;
  private readonly solverExecutor: SolverExecutor;
  private readonly writeInputFile: (
    path: string,
    content: string,
  ) => Promise<void>;

  constructor(options: SolverProcessorOptions) {
    this.inputClient = options.inputClient;
    this.solverExecutor = options.solverExecutor;
    this.writeInputFile = options.writeInputFile ?? writeFile;
  }

  async process(
    context: WorkerJobContext<TimetableSolveJobData>,
  ): Promise<WorkerCallbackPayload> {
    const job = validateJobData(context.data);
    const input = await this.inputClient.getInput(
      job.jobId,
      context.abortSignal,
    );
    const inputPath = path.join(context.tempDir, "input.json");
    const outputPath = path.join(context.tempDir, "output.json");
    await this.writeInputFile(inputPath, JSON.stringify(input));

    const result = await this.solve(inputPath, outputPath, context, job.engine);
    return { status: "completed", result };
  }

  private async solve(
    inputPath: string,
    outputPath: string,
    context: WorkerJobContext<TimetableSolveJobData>,
    requestedEngine: "auto" | "cp-sat" | "ga",
  ) {
    const firstEngine = requestedEngine === "ga" ? "ga" : "cp-sat";
    context.logger.info("Running timetable solver", {
      jobId: context.data.jobId,
      engine: firstEngine,
    });

    const firstResult = await this.solverExecutor.solve({
      inputPath,
      outputPath,
      engine: firstEngine,
      abortSignal: context.abortSignal,
    });
    if (firstResult.status === "feasible") return firstResult.result;

    if (requestedEngine !== "auto") {
      throw new WorkerExecutionError(
        "SOLVER_INFEASIBLE",
        "Solver found no valid timetable.",
        {
          engine: firstEngine,
        },
      );
    }

    context.logger.info("CP-SAT was infeasible; falling back to GA", {
      jobId: context.data.jobId,
    });
    const fallbackResult = await this.solverExecutor.solve({
      inputPath,
      outputPath,
      engine: "ga",
      abortSignal: context.abortSignal,
    });
    if (fallbackResult.status === "feasible") return fallbackResult.result;

    throw new WorkerExecutionError(
      "SOLVER_INFEASIBLE",
      "Neither solver found a valid timetable.",
      {
        engines: ["cp-sat", "ga"],
      },
    );
  }
}

function validateJobData(data: TimetableSolveJobData): {
  jobId: string;
  engine: "auto" | "cp-sat" | "ga";
} {
  const result = TimetableSolveJobDataSchema.safeParse(data);
  if (!result.success) {
    throw new WorkerExecutionError(
      "SOLVER_JOB_PROTOCOL_ERROR",
      "Solver job did not match the shared contract.",
      { issues: result.error.issues },
    );
  }

  return { jobId: result.data.jobId, engine: result.data.engine };
}
