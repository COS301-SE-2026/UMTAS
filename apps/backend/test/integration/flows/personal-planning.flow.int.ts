import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  attendanceLifecycleStep,
  personalEventCreationStep,
  personalEventDeletionStep,
  studentUniversitySelectionStep,
  timetableLifecycleStep,
  type UniversityOutput,
} from '../steps';
import {
  seedTestUniversity,
  studentAuthenticationStep,
  TEST_UNIVERSITY,
  uniqueStudentEmail,
  type StudentPlan,
} from './flow-support';

type PersonalPlanningPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly eventName: string;
  readonly eventDate: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:personal-planning] manages an event, timetable, and attendance', async () => {
  const plan: PersonalPlanningPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('personal-planning'),
    password: 'Personal!Planning2026',
    name: 'Personal Planning Student',
    eventName: 'Study planning session',
    eventDate: '2026-09-14',
  };
  const studentActor = (context: StepContext<PersonalPlanningPlan>) =>
    context.actor('student');
  const universityKey = flowKey<UniversityOutput>(
    'university.personal-planning',
  );
  const authentication = studentAuthenticationStep<PersonalPlanningPlan>();
  const universitySelection = studentUniversitySelectionStep(
    () => ({ universityKey }),
    studentActor,
  );
  const personalEvent = personalEventCreationStep(
    (flowPlan) => ({
      userIdKey: authentication.outputKey,
      eventName: flowPlan.eventName,
      eventDate: flowPlan.eventDate,
      startTime: '13:00',
      endTime: '14:30',
    }),
    studentActor,
  );
  const timetable = timetableLifecycleStep(
    () => ({
      eventKey: personalEvent.outputKey,
      initialName: 'Personal week',
      updatedName: 'Personal week revised',
    }),
    studentActor,
  );
  const attendance = attendanceLifecycleStep(
    () => ({
      eventKey: personalEvent.outputKey,
      userIdKey: authentication.outputKey,
    }),
    studentActor,
  );
  const deleteEvent = personalEventDeletionStep(
    () => ({ eventKey: personalEvent.outputKey }),
    studentActor,
  );

  await runIntegrationFlow(
    {
      name: 'personal planning and attendance lifecycle',
      plan,
      seed: ({ database, publish }) =>
        seedTestUniversity(database, universityKey, publish),
      steps: [
        authentication,
        universitySelection,
        personalEvent,
        timetable,
        attendance,
        deleteEvent,
      ],
    },
    runtime,
  );
});
