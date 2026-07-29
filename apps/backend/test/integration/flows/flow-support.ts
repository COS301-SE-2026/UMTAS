import { SeedPersistenceService } from '../../../src/db/seeding/seed-persistence.service';
import type { AppDatabase } from '../../../src/db/database.service';
import { createUniversity } from '../../../src/Testing/Factories/university.factory';
import type { FlowKey } from '../framework/contracts';
import { waitForVerificationToken } from '../framework/mailhog';
import { authenticationStep } from '../steps';
import type { UniversityOutput } from '../steps';

export const AUTH_EMAIL_TIMEOUT_MS = 30_000;
export const TEST_UNIVERSITY = createUniversity({
  UniversityID: '10000000-0000-4000-8000-000000000001',
  UniversityName: 'Full Stack Test University',
});

export type StudentPlan = {
  readonly email: string;
  readonly password: string;
  readonly name: string;
};

const persistence = new SeedPersistenceService();

export function uniqueStudentEmail(flowName: string): string {
  return `${flowName}-${Date.now()}-${process.pid}@test.umtas.local`;
}

export function studentAuthenticationStep<TPlan extends StudentPlan>() {
  return authenticationStep((plan: TPlan) => ({
    email: plan.email,
    password: plan.password,
    name: plan.name,
    resolveVerificationRequest: async () => ({
      path: `/auth/verify-email?token=${encodeURIComponent(
        await waitForVerificationToken(plan.email, AUTH_EMAIL_TIMEOUT_MS),
      )}`,
    }),
  }));
}

export async function seedTestUniversity(
  database: AppDatabase,
  universityKey: FlowKey<UniversityOutput>,
  publish: <T>(key: FlowKey<T>, value: T) => T,
): Promise<void> {
  const seededUniversity = (
    await persistence.insertUniversities(database, [TEST_UNIVERSITY])
  )[0];
  publish(universityKey, seededUniversity);
}
