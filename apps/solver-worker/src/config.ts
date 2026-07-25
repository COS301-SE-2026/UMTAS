function solverJobsUrl(backendUrl: string): string {
  return `${backendUrl.replace(/\/+$/u, "")}/solver/jobs`;
}

export function buildSolverInputUrl(backendUrl: string, jobId: string): string {
  return `${solverJobsUrl(backendUrl)}/${encodeURIComponent(jobId)}/input`;
}

export function buildSolverCallbackUrl(
  backendUrl: string,
  jobId: string,
  attemptToken: string,
): string {
  return `${solverJobsUrl(backendUrl)}/${encodeURIComponent(jobId)}/callback?attemptToken=${encodeURIComponent(attemptToken)}`;
}
