import type { SolverEngine, SolverInput, SolverResult } from "shared-types";

export interface SolverInputClient {
  getInput(jobId: string, abortSignal: AbortSignal): Promise<SolverInput>;
}

export interface SolveRequest {
  inputPath: string;
  outputPath: string;
  engine: Exclude<SolverEngine, "auto">;
  solveMode: "feasibility" | "optimization";
  abortSignal: AbortSignal;
}

export type SolverRunOutcome =
  | { status: "feasible"; result: SolverResult }
  | { status: "infeasible" };

export interface SolverExecutor {
  solve(request: SolveRequest): Promise<SolverRunOutcome>;
}
