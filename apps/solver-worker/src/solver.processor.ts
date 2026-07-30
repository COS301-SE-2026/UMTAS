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

    const result = await this.solve(
      inputPath,
      outputPath,
      context,
      job.engine,
      job.solveMode,
    );
    return { status: "completed", result };
  }

  private async solve(
    inputPath: string,
    outputPath: string,
    context: WorkerJobContext<TimetableSolveJobData>,
    requestedEngine: "auto" | "cp-sat" | "ga",
    solveMode: "feasibility" | "optimization",
  ) {
    const firstEngine = requestedEngine === "ga" ? "ga" : "cp-sat";
    context.logger.info("Running timetable solver", {
      jobId: context.data.jobId,
      engine: firstEngine,
      solveMode,
    });

    const firstResult = await this.solverExecutor.solve({
      inputPath,
      outputPath,
      engine: firstEngine,
      solveMode,
      abortSignal: context.abortSignal,
    });
    if (firstResult.status === "feasible") {
      this.logEngineResult(context, firstEngine, firstResult.result);
      return firstResult.result;
    }

    context.logger.info("SOLVER_ENGINE_RESULT", {
      jobId: context.data.jobId,
      engine: firstEngine,
      status: "infeasible",
    });

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
    context.logger.info("SOLVER_ENGINE_FALLBACK", {
      jobId: context.data.jobId,
      fromEngine: "cp-sat",
      toEngine: "ga",
      reason: "infeasible",
    });
    const fallbackResult = await this.solverExecutor.solve({
      inputPath,
      outputPath,
      engine: "ga",
      solveMode,
      abortSignal: context.abortSignal,
    });
    if (fallbackResult.status === "feasible") {
      this.logEngineResult(context, "ga", fallbackResult.result);
      return fallbackResult.result;
    }

    context.logger.info("SOLVER_ENGINE_RESULT", {
      jobId: context.data.jobId,
      engine: "ga",
      status: "infeasible",
    });

    throw new WorkerExecutionError(
      "SOLVER_INFEASIBLE",
      "Neither solver found a valid timetable.",
      {
        engines: ["cp-sat", "ga"],
      },
    );
  }

  private logEngineResult(
    context: WorkerJobContext<TimetableSolveJobData>,
    engine: "cp-sat" | "ga",
    result: { outcome: string },
  ): void {
    context.logger.info("SOLVER_ENGINE_RESULT", {
      jobId: context.data.jobId,
      engine,
      status: "feasible",
      outcome: result.outcome,
    });
  }
}

function validateJobData(data: TimetableSolveJobData): {
  jobId: string;
  engine: "auto" | "cp-sat" | "ga";
  solveMode: "feasibility" | "optimization";
} {
  const result = TimetableSolveJobDataSchema.safeParse(data);
  if (!result.success) {
    throw new WorkerExecutionError(
      "SOLVER_JOB_PROTOCOL_ERROR",
      "Solver job did not match the shared contract.",
      { issues: result.error.issues },
    );
  }

  return {
    jobId: result.data.jobId,
    engine: result.data.engine,
    solveMode: result.data.solveMode,
  };
}
