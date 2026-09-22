import { execSync } from 'node:child_process';

export default function globalTeardown() {
  try {
    execSync('cp node_modules/nyc-dark/*.css coverage/', { stdio: 'inherit' });
  } catch {
    console.log(
      `someting went wrong in apps/backend/src/Testing/jest.teardown.ts`,
    );
  }
}
