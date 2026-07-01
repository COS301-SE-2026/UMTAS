export interface PdfParseJobData {
  jobId: string;
  fileKey: string;
  adapterKey: string;
}

export interface TimetableSolveJobData {
  jobId: string;
  solverKey: string;
  mode: "feasibility" | "optimization";
}

export interface ParseAnnotation {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export interface ParsedModuleCandidate {
  code: string;
  name: string | null;
  metadata: Record<string, unknown>;
  warnings: ParseAnnotation[];
}

export interface ParsedEventCandidate {
  moduleCode: string;
  type: "lecture" | "tutorial" | "prac" | "test" | "exam";
  sectionLabel: string;
  title: string;
  day: string | null;
  date: string | null;
  startTime: string;
  endTime: string;
  venues: string[];
  isRecurring: boolean;
  metadata: Record<string, unknown>;
  warnings: ParseAnnotation[];
}

export interface PdfParserResult {
  modules: ParsedModuleCandidate[];
  events: ParsedEventCandidate[];
  warnings: ParseAnnotation[];
}

export interface WorkerCallbackError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PdfParserCallbackPayload {
  status: "completed" | "failed";
  result?: PdfParserResult;
  error?: WorkerCallbackError;
}

export interface SolverCallbackPayload {
  status: "completed" | "failed";
  result?: Record<string, unknown>;
  error?: WorkerCallbackError;
}
