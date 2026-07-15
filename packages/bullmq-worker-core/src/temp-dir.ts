import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface TempDirOptions {
  rootDir?: string;
  prefix?: string;
}

export async function createJobTempDir(
  jobId: string,
  { rootDir = tmpdir(), prefix = "umtas-worker-" }: TempDirOptions = {},
): Promise<string> {
  const safeJobId = jobId.replace(/[^a-zA-Z0-9._-]/g, "_");

  return mkdtemp(join(rootDir, `${prefix}${safeJobId}-`));
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  await rm(tempDir, { recursive: true, force: true });
}
