import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
  computePdfStreamFingerprint,
  type PdfParserResult,
} from 'shared-types';
import {
  flowKey,
  type FlowKey,
  type OutputIntegrationStep,
} from '../framework/contracts';
import { pollUntil } from '../framework/http-test-client';
import {
  expectObject,
  expectStatus,
  expectString,
  type ActorResolver,
} from './step-support';

export const PDF_LOOKUP_STEP_NAME = 'look up PDF fingerprint';

export type PdfFingerprint = {
  readonly hash: string;
  readonly streamCount: number;
  readonly algorithmVersion: typeof PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION;
};

export type PdfLookupStepPlan = {
  readonly fixturePath: string;
  readonly expectedHash: string;
  readonly universityId: string;
  readonly adapterKey?: string;
  readonly expected:
    | { readonly duplicate: false }
    | {
        readonly duplicate: true;
        readonly jobId?: string;
        readonly jobOutputKey?: FlowKey<
          | { readonly jobId: string }
          | { readonly job: { readonly jobId: string } }
        >;
        readonly status?: 'queued' | 'completed';
        readonly resultAvailable?: boolean;
        readonly moduleGroupingId?: string;
      };
};

export type PdfLookupStepOutput = {
  readonly fingerprint: PdfFingerprint;
  readonly lookup: Readonly<Record<string, unknown>>;
};

export function pdfFingerprintLookupStep<TPlan>(
  select: (plan: TPlan) => PdfLookupStepPlan,
  actor: ActorResolver<TPlan>,
  options: {
    readonly name?: string;
    readonly outputKey?: FlowKey<PdfLookupStepOutput>;
  } = {},
): OutputIntegrationStep<TPlan, PdfLookupStepOutput> {
  const name = options.name ?? PDF_LOOKUP_STEP_NAME;
  const outputKey =
    options.outputKey ?? flowKey<PdfLookupStepOutput>('pdf.fingerprint');
  return {
    name,
    outputKey,
    async run(context) {
      const plan = select(context.plan);
      assert.match(plan.expectedHash, /^[a-f0-9]{64}$/);
      const bytes = await readFile(plan.fixturePath);
      const hash = createHash('sha256');
      const fingerprint = computePdfStreamFingerprint(bytes, {
        update: (input) => hash.update(input),
        digestHex: () => hash.digest('hex'),
      });
      assert.equal(fingerprint.ok, true, 'PDF fixture must contain streams');
      if (!fingerprint.ok) throw new Error('PDF fixture has no streams');
      assert.equal(fingerprint.hash, plan.expectedHash);
      assert.equal(
        fingerprint.algorithmVersion,
        PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
      );
      assert.ok(fingerprint.streamCount > 0);

      const selectedActor = await actor(context);
      const response = await selectedActor.request.post(
        '/pdf-parser/jobs/lookup',
        {
          json: {
            universityId: plan.universityId,
            adapterKey: plan.adapterKey ?? 'up',
            fingerprintAlgorithm: fingerprint.algorithmVersion,
            pdfStreamHash: fingerprint.hash,
          },
        },
      );
      expectStatus(response, [200, 201], 'look up PDF fingerprint');
      expectObject(response.body, 'look up PDF fingerprint');
      assert.equal(response.body.duplicate, plan.expected.duplicate);
      if (!plan.expected.duplicate) {
        assert.deepEqual(response.body, { duplicate: false });
      } else {
        const expectedJob = plan.expected.jobOutputKey
          ? context.require(plan.expected.jobOutputKey)
          : undefined;
        const expectedJobId =
          plan.expected.jobId ??
          (expectedJob && 'job' in expectedJob
            ? expectedJob.job.jobId
            : expectedJob?.jobId);
        assert.ok(
          expectedJobId,
          'Duplicate lookup requires jobId or jobOutputKey',
        );
        assert.equal(response.body.jobId, expectedJobId);
        assert.equal(
          response.body.statusUrl,
          `/pdf-parser/jobs/${expectedJobId}`,
        );
        if (plan.expected.status) {
          assert.equal(response.body.status, plan.expected.status);
        } else {
          assert.match(String(response.body.status), /^(queued|completed)$/);
        }
        if (plan.expected.resultAvailable !== undefined) {
          assert.equal(
            response.body.resultAvailable,
            plan.expected.resultAvailable,
          );
        }
        if (plan.expected.moduleGroupingId !== undefined) {
          assert.equal(
            response.body.moduleGroupingId,
            plan.expected.moduleGroupingId,
          );
        }
      }

      return {
        fingerprint: {
          hash: fingerprint.hash,
          streamCount: fingerprint.streamCount,
          algorithmVersion: fingerprint.algorithmVersion,
        },
        lookup: response.body,
      };
    },
  };
}

export const PDF_UPLOAD_ONLY_STEP_NAME = 'upload PDF';

export type PdfUploadOnlyStepPlan = {
  readonly fixturePath: string;
  readonly universityId: string;
  readonly fingerprintKey: FlowKey<PdfLookupStepOutput>;
};

export type PdfUploadOutput = {
  readonly jobId: string;
  readonly status: 'queued';
  readonly adapterKey: 'up';
  readonly fileKey: string;
  readonly statusUrl: string;
};

export function pdfUploadStep<TPlan>(
  select: (plan: TPlan) => PdfUploadOnlyStepPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, PdfUploadOutput> {
  return {
    name: PDF_UPLOAD_ONLY_STEP_NAME,
    outputKey: flowKey<PdfUploadOutput>('pdf.upload'),
    async run(context) {
      const plan = select(context.plan);
      const fingerprint = context.require(plan.fingerprintKey).fingerprint;
      const bytes = await readFile(plan.fixturePath);
      const selectedActor = await actor(context);
      const response = await selectedActor.request.post(
        '/pdf-parser/jobs/upload',
        {
          fields: {
            adapterKey: 'up',
            universityId: plan.universityId,
            fingerprintAlgorithm: fingerprint.algorithmVersion,
            clientPdfStreamHash: fingerprint.hash,
            streamCount: String(fingerprint.streamCount),
          },
          files: [
            {
              field: 'file',
              buffer: bytes,
              filename: 'CONFLICT_FALLBACK.pdf',
              contentType: 'application/pdf',
            },
          ],
        },
      );
      expectStatus(response, 202, 'upload PDF');
      expectObject(response.body, 'upload PDF');
      expectString(response.body.jobId, 'PDF parser jobId');
      expectString(response.body.fileKey, 'PDF parser fileKey');
      const jobId = response.body.jobId;
      assert.match(jobId, /^pdf-parse-/);
      assert.equal(response.body.status, 'queued');
      assert.equal(response.body.adapterKey, 'up');
      assert.equal(response.body.statusUrl, `/pdf-parser/jobs/${jobId}`);
      assert.match(
        response.body.fileKey,
        /^uploads\/pdf-parser\/pdf-parse-.*\/conflict-fallback\.pdf$/,
      );
      return response.body as unknown as PdfUploadOutput;
    },
  };
}

export const PDF_IMPORT_RESOLUTION_STEP_NAME =
  'wait for and resolve PDF import';

export type PdfUploadStepOutput = {
  readonly job: Readonly<Record<string, unknown>> & {
    readonly jobId: string;
    readonly status: string;
    readonly moduleGroupingId: string;
  };
  readonly result: PdfParserResult;
  readonly module: Readonly<Record<string, unknown>> & {
    readonly moduleID: string;
    readonly moduleCode: string;
  };
  readonly events: readonly (Readonly<Record<string, unknown>> & {
    readonly eventId: string;
  })[];
  readonly eventIds: readonly string[];
  readonly fileKey: string;
};

export type PdfImportResolutionStepPlan = {
  readonly uploadKey: FlowKey<PdfUploadOutput>;
  readonly fingerprintKey: FlowKey<PdfLookupStepOutput>;
  readonly universityId: string;
  readonly parserTimeoutMs?: number;
  readonly expectedModuleCode: string;
  readonly expectedActivityCodes: readonly string[];
};

export function pdfImportResolutionStep<TPlan>(
  select: (plan: TPlan) => PdfImportResolutionStepPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, PdfUploadStepOutput> {
  return {
    name: PDF_IMPORT_RESOLUTION_STEP_NAME,
    outputKey: flowKey<PdfUploadStepOutput>('pdf.import'),
    async run(context) {
      const plan = select(context.plan);
      const upload = context.require(plan.uploadKey);
      const fingerprint = context.require(plan.fingerprintKey).fingerprint;
      const jobId = upload.jobId;
      const selectedActor = await actor(context);

      const job = await pollUntil(
        async () => {
          const current = await selectedActor.request.get(
            `/pdf-parser/jobs/${jobId}`,
          );
          expectStatus(current, 200, 'poll PDF parser job');
          expectObject(current.body, 'poll PDF parser job');
          return current.body;
        },
        (value) => value.status === 'completed',
        {
          timeoutMs: plan.parserTimeoutMs ?? 90_000,
          intervalMs: 250,
          fail: (value) =>
            value.status === 'failed'
              ? `PDF parser job failed: ${JSON.stringify(value)}`
              : undefined,
        },
      );
      expectString(job.moduleGroupingId, 'moduleGroupingId');

      const resultResponse = await selectedActor.request.get(
        `/pdf-parser/jobs/${jobId}/result`,
      );
      expectStatus(resultResponse, 200, 'retrieve PDF parser result');
      expectObject(resultResponse.body, 'retrieve PDF parser result');
      const result = resultResponse.body as unknown as PdfParserResult;
      assert.deepEqual(result.modules, [
        {
          code: plan.expectedModuleCode,
          name: null,
          metadata: { campus: 'Main', semester: 'SEMESTER_1' },
          warnings: [],
        },
      ]);
      assert.deepEqual(result.warnings, []);
      assert.deepEqual(
        result.events.map((event) => ({
          moduleCode: event.moduleCode,
          activityCode: event.activityCode,
          day: event.day,
          startTime: event.startTime,
          endTime: event.endTime,
          venues: event.venues,
          isRecurring: event.isRecurring,
          warnings: event.warnings,
        })),
        [
          {
            moduleCode: plan.expectedModuleCode,
            activityCode: plan.expectedActivityCodes[0],
            day: 'monday',
            startTime: '08:00',
            endTime: '09:00',
            venues: ['IT 1-1'],
            isRecurring: true,
            warnings: [],
          },
          {
            moduleCode: plan.expectedModuleCode,
            activityCode: plan.expectedActivityCodes[1],
            day: 'monday',
            startTime: '08:00',
            endTime: '09:00',
            venues: ['IT 1-2'],
            isRecurring: true,
            warnings: [],
          },
        ],
      );

      const modulesResponse = await selectedActor.request.get(
        `/modules?GroupID=${encodeURIComponent(job.moduleGroupingId)}`,
      );
      expectStatus(modulesResponse, 200, 'retrieve imported modules');
      expectObject(modulesResponse.body, 'retrieve imported modules');
      assert.ok(Array.isArray(modulesResponse.body.modules));
      assert.equal(modulesResponse.body.modules.length, 1);
      const module = modulesResponse.body.modules[0] as Record<string, unknown>;
      expectString(module.moduleID, 'imported module ID');
      assert.equal(module.moduleCode, plan.expectedModuleCode);
      assert.equal(module.validated, false);
      assert.equal(module.ModuleGroupingID, job.moduleGroupingId);

      const eventsResponse = await selectedActor.request.get(
        `/events?moduleId=${encodeURIComponent(module.moduleID)}`,
      );
      expectStatus(eventsResponse, 200, 'retrieve imported events');
      expectObject(eventsResponse.body, 'retrieve imported events');
      assert.ok(Array.isArray(eventsResponse.body.events));
      const events = (
        eventsResponse.body.events as Array<
          Record<string, unknown> & { eventId: string }
        >
      ).sort((left, right) =>
        String(left.activityCode).localeCompare(String(right.activityCode)),
      );
      assert.equal(events.length, 2);
      for (const event of events) expectString(event.eventId, 'eventId');
      assert.deepEqual(
        events.map((event) => ({
          activityCode: event.activityCode,
          activityType: event.activityType,
          moduleId: (event.eventCriteria as Record<string, unknown>).moduleId,
          dayOfWeek: (event.eventCriteria as Record<string, unknown>).dayOfWeek,
          startTime: (event.eventCriteria as Record<string, unknown>).startTime,
          endTime: (event.eventCriteria as Record<string, unknown>).endTime,
          venueNames: (event.venues as Record<string, unknown>[]).map(
            (venue) => venue.venueName,
          ),
        })),
        [
          {
            activityCode: 'L1',
            activityType: 'lecture',
            moduleId: module.moduleID,
            dayOfWeek: 'monday',
            startTime: '08:00',
            endTime: '09:00',
            venueNames: ['IT 1-1'],
          },
          {
            activityCode: 'T1',
            activityType: 'tutorial',
            moduleId: module.moduleID,
            dayOfWeek: 'monday',
            startTime: '08:00',
            endTime: '09:00',
            venueNames: ['IT 1-2'],
          },
        ],
      );

      const completedLookup = await selectedActor.request.post(
        '/pdf-parser/jobs/lookup',
        {
          json: {
            universityId: plan.universityId,
            adapterKey: 'up',
            fingerprintAlgorithm: fingerprint.algorithmVersion,
            pdfStreamHash: fingerprint.hash,
          },
        },
      );
      expectStatus(completedLookup, [200, 201], 'completed PDF lookup');
      assert.deepEqual(completedLookup.body, {
        duplicate: true,
        jobId: upload.jobId,
        status: 'completed',
        moduleGroupingId: job.moduleGroupingId,
        resultAvailable: true,
        statusUrl: `/pdf-parser/jobs/${upload.jobId}`,
      });

      return {
        job: job as PdfUploadStepOutput['job'],
        result,
        module: module as PdfUploadStepOutput['module'],
        events,
        eventIds: events.map((event) => event.eventId),
        fileKey: upload.fileKey,
      };
    },
  };
}
