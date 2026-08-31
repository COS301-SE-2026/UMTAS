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
import { SeedPersistenceService } from '../../../src/db/seeding/seed-persistence.service';
import { PublicCalendarSeedService } from '../../../src/db/seeding/services/public-calendar.seed.service';
import { createUniversity } from '../../../src/Testing/Factories/university.factory';
import { waitForVerificationToken } from '../framework/mailhog';

type AcademicCalendarPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly calendarYear: number;
  readonly eventDate: string;
  readonly isolationStudent: StudentPlan;
};

const ISOLATION_UNIVERSITY = createUniversity({
  UniversityID: '10000000-0000-4000-8000-000000000002',
  UniversityName: 'Calendar Isolation University',
  ApiIdentifier: 'CALISO',
});

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
    isolationStudent: {
      email: uniqueStudentEmail('academic-calendar-isolation'),
      password: 'Academic!Isolation2026',
      name: 'Academic Calendar Isolation Student',
    },
  };
  const administratorActor = (context: StepContext<AcademicCalendarPlan>) =>
    context.actor('student');
  const universityKey = flowKey<UniversityOutput>(
    'university.academic-calendar',
  );
  const isolationUniversityKey = flowKey<UniversityOutput>(
    'university.academic-calendar-isolation',
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
      isolationUniversityKey,
      isolationStudent: {
        ...flowPlan.isolationStudent,
        resolveVerificationRequest: async () => ({
          path: `/auth/verify-email?token=${encodeURIComponent(
            await waitForVerificationToken(
              flowPlan.isolationStudent.email,
              30_000,
            ),
          )}`,
        }),
      },
      calendarYear: flowPlan.calendarYear,
    }),
    administratorActor,
  );

  await runIntegrationFlow(
    {
      name: 'academic calendar administration and generation',
      plan,
      seed: async (seedContext) => {
        await seedTestUniversity(
          seedContext.database,
          universityKey,
          (key, value) => seedContext.publish(key, value),
        );
        const persistence = new SeedPersistenceService();
        const [isolationUniversity] = await persistence.insertUniversities(
          seedContext.database,
          [ISOLATION_UNIVERSITY],
        );
        seedContext.publish(isolationUniversityKey, isolationUniversity);
        await new PublicCalendarSeedService(persistence).seed(
          seedContext.database,
        );
      },
      steps: [authentication, adminSelection, personalEvent, calendarLifecycle],
    },
    runtime,
  );
});
