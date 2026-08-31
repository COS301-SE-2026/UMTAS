import path from 'node:path';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  moduleEnrollmentStep,
  pdfFingerprintLookupStep,
  pdfImportResolutionStep,
  pdfSolverFinalAssertionsStep,
  pdfUploadStep,
  solverStep,
  studentUniversitySelectionStep,
  timetableCreationStep,
  type PdfLookupStepOutput,
  type UniversityOutput,
} from '../steps';
import {
  seedTestUniversity,
  studentAuthenticationStep,
  TEST_UNIVERSITY,
  uniqueStudentEmail,
  type StudentPlan,
} from './flow-support';

const CONFLICT_PDF_STREAM_FINGERPRINT =
  '2f366fe4a2698ee70e97618bc89dbf19e08526c75c477be43c863e2d62c81da5';
const FIXTURE_PATH = path.resolve(
  process.cwd(),
  '../pdf_parser/up_test_pdfs/CONFLICT_FALLBACK.pdf',
);

type PdfSolverPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly fixturePath: string;
  readonly fingerprint: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

xtest('[flow:pdf-solver] uploads, imports, enrolls, solves, and saves a timetable', async () => {
  const plan: PdfSolverPlan = {
    university: TEST_UNIVERSITY,
    fixturePath: FIXTURE_PATH,
    fingerprint: CONFLICT_PDF_STREAM_FINGERPRINT,
    email: uniqueStudentEmail('pdf-solver'),
    password: 'FullStack!Test2026',
    name: 'PDF Solver Student',
  };
  const studentActor = (context: StepContext<PdfSolverPlan>) =>
    context.actor('student');
  const universityKey = flowKey<UniversityOutput>('university.pdf-solver');
  const fingerprintMissKey = flowKey<PdfLookupStepOutput>(
    'pdf.fingerprint.miss',
  );
  const fingerprintHitKey = flowKey<PdfLookupStepOutput>('pdf.fingerprint.hit');
  const authentication = studentAuthenticationStep<PdfSolverPlan>();
  const universitySelection = studentUniversitySelectionStep(
    () => ({ universityKey }),
    studentActor,
  );
  const fingerprintMiss = pdfFingerprintLookupStep(
    (flowPlan) => ({
      fixturePath: flowPlan.fixturePath,
      expectedHash: flowPlan.fingerprint,
      universityId: flowPlan.university.UniversityID,
      expected: { duplicate: false },
    }),
    studentActor,
    {
      name: 'verify PDF fingerprint lookup miss',
      outputKey: fingerprintMissKey,
    },
  );
  const upload = pdfUploadStep(
    (flowPlan) => ({
      fixturePath: flowPlan.fixturePath,
      universityId: flowPlan.university.UniversityID,
      fingerprintKey: fingerprintMiss.outputKey,
    }),
    studentActor,
  );
  const fingerprintHit = pdfFingerprintLookupStep(
    (flowPlan) => ({
      fixturePath: flowPlan.fixturePath,
      expectedHash: flowPlan.fingerprint,
      universityId: flowPlan.university.UniversityID,
      expected: {
        duplicate: true,
        jobOutputKey: upload.outputKey,
      },
    }),
    studentActor,
    {
      name: 'verify PDF fingerprint lookup hit',
      outputKey: fingerprintHitKey,
    },
  );
  const imported = pdfImportResolutionStep(
    (flowPlan) => ({
      uploadKey: upload.outputKey,
      fingerprintKey: fingerprintMiss.outputKey,
      universityId: flowPlan.university.UniversityID,
      parserTimeoutMs: 90_000,
      expectedModuleCode: 'CFT101',
      expectedActivityCodes: ['L1', 'T1'],
    }),
    studentActor,
  );
  const enrollment = moduleEnrollmentStep(
    () => ({
      moduleKey: imported.outputKey,
      expectedEventIdsKey: imported.outputKey,
      userIdKey: authentication.outputKey,
    }),
    studentActor,
  );
  const solved = solverStep(
    () => ({
      eventIdsKey: enrollment.outputKey,
      timeoutMs: 330_000,
    }),
    studentActor,
  );
  const timetable = timetableCreationStep(
    () => ({
      selectedEventIdsKey: solved.outputKey,
      timetableName: 'Conflict Fallback Integration',
      userIdKey: authentication.outputKey,
    }),
    studentActor,
  );
  const finalAssertions = pdfSolverFinalAssertionsStep(
    (flowPlan) => ({
      universityId: flowPlan.university.UniversityID,
      expectedFingerprint: flowPlan.fingerprint,
      authenticationKey: authentication.outputKey,
      selectionKey: universitySelection.outputKey,
      fingerprintKey: fingerprintMiss.outputKey,
      importKey: imported.outputKey,
      enrollmentKey: enrollment.outputKey,
      solverKey: solved.outputKey,
      timetableKey: timetable.outputKey,
      assertObjectExists: async (fileKey) => {
        await runtime.objectStore.send(
          new HeadObjectCommand({
            Bucket: process.env.MINIO_BUCKET ?? 'umtas-uploads',
            Key: fileKey,
          }),
        );
      },
    }),
    studentActor,
  );

  await runIntegrationFlow(
    {
      name: 'PDF import, enrollment, fallback solve, and timetable',
      plan,
      seed: ({ database, publish }) =>
        seedTestUniversity(database, universityKey, publish),
      steps: [
        authentication,
        universitySelection,
        fingerprintMiss,
        upload,
        fingerprintHit,
        imported,
        enrollment,
        solved,
        timetable,
        finalAssertions,
      ],
    },
    runtime,
  );
}, 480_000);
