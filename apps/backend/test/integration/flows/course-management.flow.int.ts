import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  builderModuleCreationStep,
  builderModuleDeletionStep,
  personalEventCreationStep,
  personalEventDeletionStep,
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

type CourseManagementPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly eventDate: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:course-management] creates a module and manages its event', async () => {
  const plan: CourseManagementPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('course-management'),
    password: 'Course!Management2026',
    name: 'Course Management Student',
    eventDate: '2026-09-15',
  };
  const studentActor = (context: StepContext<CourseManagementPlan>) =>
    context.actor('student');
  const universityKey = flowKey<UniversityOutput>(
    'university.course-management',
  );
  const authentication = studentAuthenticationStep<CourseManagementPlan>();
  const universitySelection = studentUniversitySelectionStep(
    () => ({ universityKey }),
    studentActor,
  );
  const moduleCreation = builderModuleCreationStep(
    () => ({
      authenticationKey: authentication.outputKey,
      moduleCode: 'COURSE101',
      moduleName: 'Course management',
      colour: '#3B82F6',
    }),
    studentActor,
  );
  const eventCreation = personalEventCreationStep(
    (flowPlan) => ({
      userIdKey: authentication.outputKey,
      eventName: 'Course management lecture',
      eventDate: flowPlan.eventDate,
      startTime: '09:00',
      endTime: '10:00',
    }),
    studentActor,
  );
  const eventDeletion = personalEventDeletionStep(
    () => ({ eventKey: eventCreation.outputKey }),
    studentActor,
  );
  const moduleDeletion = builderModuleDeletionStep(
    () => ({ moduleKey: moduleCreation.outputKey }),
    studentActor,
  );

  await runIntegrationFlow(
    {
      name: 'custom course module and event management',
      plan,
      seed: ({ database, publish }) =>
        seedTestUniversity(database, universityKey, publish),
      steps: [
        authentication,
        universitySelection,
        moduleCreation,
        eventCreation,
        eventDeletion,
        moduleDeletion,
      ],
    },
    runtime,
  );
});
