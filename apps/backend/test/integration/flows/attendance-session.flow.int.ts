import { flowKey } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  attendanceSessionLifecycleStep,
  type UniversityOutput,
} from '../steps';
import {
  seedTestUniversity,
  studentAuthenticationStep,
  TEST_UNIVERSITY,
  uniqueStudentEmail,
  type StudentPlan,
} from './flow-support';

type AttendancePlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
};
let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});
afterAll(async () => {
  await runtime.close();
});

test('[flow:attendance-session] manages verified attendance and persists totals', async () => {
  const plan: AttendancePlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('attendance-session'),
    password: 'Attendance!2026',
    name: 'Attendance Operator',
  };
  const universityKey = flowKey<UniversityOutput>(
    'university.attendance-session',
  );
  const authentication = studentAuthenticationStep<AttendancePlan>();
  const lifecycle = attendanceSessionLifecycleStep<AttendancePlan>(
    () => ({ authenticationKey: authentication.outputKey, universityKey }),
    (context) => context.actor('student'),
  );
  await runIntegrationFlow(
    {
      name: 'verified attendance session lifecycle',
      plan,
      seed: ({ database, publish }) =>
        seedTestUniversity(database, universityKey, publish),
      steps: [authentication, lifecycle],
    },
    runtime,
  );
});
