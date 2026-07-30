import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  builderModuleLifecycleStep,
  studentUniversitySelectionStep,
  type UniversityOutput,
} from '../steps';
import {
  seedTestUniversity,
  studentAuthenticationStep,
  TEST_UNIVERSITY,
  uniqueStudentEmail,
  type StudentPlan,
} from './flow-support';

type UserOnboardingPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:onboarding] authenticates, selects a university, and uses the manual builder', async () => {
  const plan: UserOnboardingPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('onboarding'),
    password: 'Onboarding!Journey2026',
    name: 'Onboarding Student',
  };
  const studentActor = (context: StepContext<UserOnboardingPlan>) =>
    context.actor('student');
  const universityKey = flowKey<UniversityOutput>('university.onboarding');
  const authentication = studentAuthenticationStep<UserOnboardingPlan>();
  const universitySelection = studentUniversitySelectionStep(
    () => ({ universityKey }),
    studentActor,
  );
  const manualBuilder = builderModuleLifecycleStep(
    () => ({
      authenticationKey: authentication.outputKey,
      moduleCode: 'SELF101',
      initialName: 'Self-directed study',
      updatedName: 'Self-directed study revised',
      initialColour: '#3366CC',
      updatedColour: '#CC6633',
    }),
    studentActor,
  );

  await runIntegrationFlow(
    {
      name: 'student onboarding and manual timetable building',
      plan,
      seed: ({ database, publish }) =>
        seedTestUniversity(database, universityKey, publish),
      steps: [authentication, universitySelection, manualBuilder],
    },
    runtime,
  );
});
