import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION } from 'shared-types';
import {
  Event,
  EventsToTimetables,
  EventVenue,
  GroupModules,
  ModuleEnrollment,
  modules,
  parseJob,
  solverJob,
  Timetable,
  UniversityEvent,
  UniversityRole,
  UserTimetable,
  Venue,
} from '../../../src/entities';
import type { FlowKey, IntegrationStep } from '../framework/contracts';
import type { AuthenticationStepOutput } from './authentication.step';
import type { ModuleEnrollmentOutput } from './enrollment.step';
import type { PdfLookupStepOutput, PdfUploadStepOutput } from './pdf.step';
import type { SolverStepOutput } from './solver.step';
import {
  expectObject,
  expectStatus,
  sorted,
  type ActorResolver,
} from './step-support';
import type { TimetableStepOutput } from './timetable.step';
import type { UniversitySelectionOutput } from './university.step';

export const PDF_SOLVER_FINAL_STEP_NAME =
  'assert final PDF-to-timetable journey';

export type PdfSolverFinalStepPlan = {
  readonly universityId: string;
  readonly expectedFingerprint: string;
  readonly authenticationKey: FlowKey<AuthenticationStepOutput>;
  readonly selectionKey: FlowKey<UniversitySelectionOutput>;
  readonly fingerprintKey: FlowKey<PdfLookupStepOutput>;
  readonly importKey: FlowKey<PdfUploadStepOutput>;
  readonly enrollmentKey: FlowKey<ModuleEnrollmentOutput>;
  readonly solverKey: FlowKey<SolverStepOutput>;
  readonly timetableKey: FlowKey<TimetableStepOutput>;
  readonly assertObjectExists: (fileKey: string) => Promise<void>;
};

export type PdfSolverFinalOutput = {
  readonly userId: string;
  readonly universityId: string;
  readonly parseJobId: string;
  readonly moduleId: string;
  readonly eventIds: readonly string[];
  readonly solverJobId: string;
  readonly timetableId: string;
};

export function pdfSolverFinalAssertionsStep<TPlan>(
  select: (plan: TPlan) => PdfSolverFinalStepPlan,
  actor: ActorResolver<TPlan>,
): IntegrationStep<TPlan, PdfSolverFinalOutput> {
  return {
    name: PDF_SOLVER_FINAL_STEP_NAME,
    async run(context) {
      const plan = select(context.plan);
      const identity = context.require(plan.authenticationKey);
      const selection = context.require(plan.selectionKey);
      const fingerprint = context.require(plan.fingerprintKey).fingerprint;
      const imported = context.require(plan.importKey);
      const enrollment = context.require(plan.enrollmentKey);
      const solved = context.require(plan.solverKey);
      const timetable = context.require(plan.timetableKey);
      const db = context.runtime.database;
      const eventIds = sorted(imported.eventIds);

      assert.equal(selection.role.UserID, identity.userId);
      assert.equal(selection.role.UniversityID, plan.universityId);
      assert.equal(imported.module.moduleID, enrollment.module.moduleID);
      assert.deepEqual(sorted(enrollment.eligibleEventIds), eventIds);
      assert.deepEqual(sorted(solved.selectedEventIds), eventIds);
      assert.deepEqual(sorted(timetable.eventIds), eventIds);

      const parseRows = await db
        .select()
        .from(parseJob)
        .where(
          eq(parseJob.JobID, imported.job.jobId.replace(/^pdf-parse-/, '')),
        );
      assert.equal(parseRows.length, 1);
      assert.deepEqual(
        {
          userId: parseRows[0].UserID,
          universityId: parseRows[0].UniversityID,
          adapter: parseRows[0].AdapterKey,
          clientHash: parseRows[0].ClientPdfStreamHash,
          serverHash: parseRows[0].PdfStreamHash,
          algorithm: parseRows[0].FingerprintAlgorithm,
          groupId: parseRows[0].GroupID,
          status: parseRows[0].Status,
        },
        {
          userId: identity.userId,
          universityId: plan.universityId,
          adapter: 'up',
          clientHash: plan.expectedFingerprint,
          serverHash: plan.expectedFingerprint,
          algorithm: PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
          groupId: imported.job.moduleGroupingId,
          status: 'completed',
        },
      );
      assert.ok(parseRows[0].StreamCount > 0);
      assert.ok(parseRows[0].Result);

      const [
        allModules,
        groupLinks,
        allEvents,
        universityEvents,
        venues,
        eventVenues,
        roles,
        enrollments,
        solverRows,
        timetables,
        userTimetables,
        timetableEvents,
      ] = await Promise.all([
        db.select().from(modules),
        db.select().from(GroupModules),
        db.select().from(Event),
        db.select().from(UniversityEvent),
        db.select().from(Venue),
        db.select().from(EventVenue),
        db.select().from(UniversityRole),
        db.select().from(ModuleEnrollment),
        db.select().from(solverJob),
        db.select().from(Timetable),
        db.select().from(UserTimetable),
        db.select().from(EventsToTimetables),
      ]);

      assert.equal(allModules.length, 1, 'no replacement module may be seeded');
      assert.equal(allEvents.length, 2, 'no replacement events may be seeded');
      assert.equal(enrollments.length, 1, 'one controller-owned enrollment');
      assert.equal(solverRows.length, 1, 'one worker-produced solver result');
      assert.equal(timetables.length, 1, 'one controller-owned timetable');
      assert.equal(groupLinks.length, 1);
      assert.equal(groupLinks[0].GroupID, imported.job.moduleGroupingId);
      assert.equal(groupLinks[0].ModuleID, imported.module.moduleID);
      assert.deepEqual(
        sorted(universityEvents.map((row) => row.eventID!)),
        eventIds,
      );
      assert.deepEqual(sorted(eventVenues.map((row) => row.EventID)), eventIds);
      assert.deepEqual(
        venues
          .filter((row) => row.UniversityID === plan.universityId)
          .map((row) => row.VenueName)
          .sort(),
        ['IT 1-1', 'IT 1-2'],
      );
      assert.ok(
        roles.some(
          (row) =>
            row.UserID === identity.userId &&
            row.UniversityID === plan.universityId &&
            row.role === 'STUDENT',
        ),
      );
      assert.deepEqual(enrollments, [
        {
          UserID: identity.userId,
          ModuleID: imported.module.moduleID,
        },
      ]);

      const solverRow = solverRows[0];
      assert.equal(solverRow.JobID, solved.jobId.replace(/^solve-/, ''));
      assert.equal(solverRow.UserID, identity.userId);
      assert.equal(solverRow.RequestedEngine, 'auto');
      assert.equal(solverRow.SolveMode, 'optimization');
      assert.equal(solverRow.Status, 'completed');
      assert.ok(solverRow.Result);
      const solverEvents = solverRow.Input.schedulingProblem.events;
      assert.deepEqual(
        sorted(solverEvents.map((event) => event.eventId)),
        eventIds,
      );
      assert.deepEqual(
        solverEvents
          .map((event) => ({
            activity: `${event.moduleCode}:${event.activityCode}`,
            day: event.dayOfWeek,
            start: event.startTime,
            end: event.endTime,
            requiredSelections: event.requiredSelections,
          }))
          .sort((left, right) => left.activity.localeCompare(right.activity)),
        [
          {
            activity: 'CFT101:L1',
            day: 'monday',
            start: '08:00',
            end: '09:00',
            requiredSelections: 1,
          },
          {
            activity: 'CFT101:T1',
            day: 'monday',
            start: '08:00',
            end: '09:00',
            requiredSelections: 1,
          },
        ],
      );

      assert.equal(timetables[0].timetableID, timetable.timetable.timetableID);
      assert.deepEqual(userTimetables, [
        {
          UserTimetableID: timetable.UserTimetableID,
          UserID: identity.userId,
          TimetableID: timetable.timetable.timetableID,
        },
      ]);
      assert.deepEqual(
        sorted(timetableEvents.map((row) => row.eventID)),
        eventIds,
      );

      await plan.assertObjectExists(imported.fileKey);

      const student = await actor(context);
      const finalLookup = await student.request.post(
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
      expectStatus(finalLookup, [200, 201], 'final PDF lookup');
      expectObject(finalLookup.body, 'final PDF lookup');
      assert.deepEqual(finalLookup.body, {
        duplicate: true,
        jobId: imported.job.jobId,
        status: 'completed',
        moduleGroupingId: imported.job.moduleGroupingId,
        resultAvailable: true,
        statusUrl: `/pdf-parser/jobs/${imported.job.jobId}`,
      });

      return {
        userId: identity.userId,
        universityId: plan.universityId,
        parseJobId: imported.job.jobId,
        moduleId: imported.module.moduleID,
        eventIds,
        solverJobId: solved.jobId,
        timetableId: timetable.timetable.timetableID,
      };
    },
  };
}
