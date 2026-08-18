import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  academicCalendarLifecycleStep,
  personalEventCreationStep,
  universityAdminSelectionStep,
  type UniversityOutput,
} from '../steps';
import {
  seedTestUniversity,
  studentAuthenticationStep,
  TEST_UNIVERSITY,
  uniqueStudentEmail,
  type StudentPlan,
} from './flow-support';

type AcademicCalendarPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly calendarYear: number;
  readonly eventDate: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:academic-calendar] manages restrictions and generates a persisted calendar', async () => {
  const calendarYear = new Date().getUTCFullYear();
  const plan: AcademicCalendarPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('academic-calendar'),
    password: 'Academic!Calendar2026',
    name: 'Academic Calendar Administrator',
    calendarYear,
    eventDate: `${calendarYear}-09-15`,
  };
  const administratorActor = (context: StepContext<AcademicCalendarPlan>) =>
    context.actor('student');
  const universityKey = flowKey<UniversityOutput>(
    'university.academic-calendar',
  );
  const authentication = studentAuthenticationStep<AcademicCalendarPlan>();
  const adminSelection = universityAdminSelectionStep(
    (flowPlan) => ({
      authenticationKey: authentication.outputKey,
      universityKey,
      calendarYear: flowPlan.calendarYear,
    }),
    administratorActor,
  );
  const personalEvent = personalEventCreationStep(
    (flowPlan) => ({
      userIdKey: authentication.outputKey,
      eventName: 'Calendar planning session',
      eventDate: flowPlan.eventDate,
      startTime: '13:00',
      endTime: '14:30',
    }),
    administratorActor,
  );
  const calendarLifecycle = academicCalendarLifecycleStep(
    (flowPlan) => ({
      adminSelectionKey: adminSelection.outputKey,
      eventKey: personalEvent.outputKey,
      calendarYear: flowPlan.calendarYear,
    }),
    administratorActor,
  );

  await runIntegrationFlow(
    {
      name: 'academic calendar administration and generation',
      plan,
      seed: (seedContext) =>
        seedTestUniversity(seedContext.database, universityKey, (key, value) =>
          seedContext.publish(key, value),
        ),
      steps: [authentication, adminSelection, personalEvent, calendarLifecycle],
    },
    runtime,
  );
});
