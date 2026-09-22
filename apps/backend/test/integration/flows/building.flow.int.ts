import assert from 'node:assert/strict';
import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import {
  expectObject,
  expectStatus,
  expectString,
} from '../steps/step-support';
import {
  seedTestUniversity,
  studentAuthenticationStep,
  TEST_UNIVERSITY,
  uniqueStudentEmail,
  type StudentPlan,
} from './flow-support';
import { universityAdminSelectionStep, type UniversityOutput } from '../steps';
import {
  Building,
  Event,
  EventAttendance,
  EventVenue,
  usersTable,
  Venue,
} from 'src/entities';
import { eq } from 'drizzle-orm';
import {
  createAttendance,
  createBuilding,
  createEvent,
  createEventVenue,
  createVenue,
} from 'src/Testing/Factories';
import { EventSource } from 'src/Events/dto/event.types';

type BuildingManagementPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly buildingName: string;
  readonly updatedBuildingName: string;
};

type BuildingOutput = {
  readonly buildingId: string;
  readonly buildingName: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:building] manages buildings through the HTTP API', async () => {
  const plan: BuildingManagementPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('building'),
    password: 'Building!Management2026',
    name: 'Building Management Administrator',
    buildingName: 'Integration Science Building',
    updatedBuildingName: 'Updated Integration Science Building',
  };

  const administrator = (context: StepContext<BuildingManagementPlan>) =>
    context.actor('student');

  const universityKey = flowKey<UniversityOutput>('university.building');

  const buildingKey = flowKey<BuildingOutput>('building.building');

  const authentication = studentAuthenticationStep<BuildingManagementPlan>();

  const adminSelection = universityAdminSelectionStep(
    () => ({
      authenticationKey: authentication.outputKey,
      universityKey,
      calendarYear: new Date().getUTCFullYear(),
    }),
    administrator,
  );

  await runIntegrationFlow(
    {
      name: 'building',
      plan,

      seed: async ({ database, publish }) => {
        await seedTestUniversity(database, universityKey, publish);
      },

      steps: [
        authentication,
        adminSelection,

        //Create
        {
          name: 'create building',
          outputKey: buildingKey,

          async run(context) {
            const response = await administrator(context).request.post(
              '/buildings',
              {
                json: {
                  BuildingName: context.plan.buildingName,
                  location: {
                    lat: -25.7545,
                    lng: 28.2314,
                  },
                  footprint: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [28.2313, -25.7544],
                        [28.2315, -25.7544],
                        [28.2315, -25.7546],
                        [28.2313, -25.7546],
                        [28.2313, -25.7544],
                      ],
                    ],
                  },
                  icon: 'science',
                  displayColour: '#2563EB',
                },
              },
            );

            expectStatus(response, 201, 'create building');
            expectObject(response.body, 'create building');
            expectObject(response.body.building, 'created building');

            const building = response.body.building;

            expectString(building.BuildingID, 'building.BuildingID');
            assert.equal(building.BuildingName, context.plan.buildingName);
            assert.equal(
              building.UniversityID,
              context.plan.university.UniversityID,
            );

            return {
              buildingId: building.BuildingID,
              buildingName: building.BuildingName,
            };
          },
        },
        {
          name: 'seed venue for building',

          async run(context) {
            const building = context.require(buildingKey);
            const venue = createVenue({
              UniversityID: context.plan.university.UniversityID,
              BuildingID: building.buildingId,
              VenueName: 'Integration Science Venue',
              Capacity: 120,
            });

            await context.runtime.database.insert(Venue).values(venue);
          },
        },

        {
          name: 'retrieve building with attached venues',

          async run(context) {
            const building = context.require(buildingKey);

            const response = await administrator(context).request.get(
              `/buildings/${building.buildingId}`,
            );

            expectStatus(response, 200, 'retrieve building with venues');
            expectObject(response.body, 'retrieve building with venues');
            expectObject(
              response.body.building,
              'retrieved building with venues',
            );

            assert.ok(
              Array.isArray(response.body.venues),
              'retrieved building must include venues',
            );
            assert.ok(
              response.body.venues.length > 0,
              'retrieved building must include at least one venue',
            );
            assert.equal(
              response.body.venues[0].BuildingID,
              building.buildingId,
            );
          },
        },

        {
          name: 'list unmapped buildings',

          async run(context) {
            const unmappedBuilding = createBuilding({
              UniversityID: context.plan.university.UniversityID,
              BuildingName: 'Integration Unmapped Building',
              Latitude: null,
              Longitude: null,
            });

            await context.runtime.database
              .insert(Building)
              .values(unmappedBuilding);

            const response = await administrator(context).request.get(
              '/buildings?mapped=false',
            );

            expectStatus(response, 200, 'list unmapped buildings');
            expectObject(response.body, 'list unmapped buildings');
            assert.ok(Array.isArray(response.body.buildings));

            const building = response.body.buildings.find(
              (item: Record<string, unknown>) =>
                item.BuildingID === unmappedBuilding.BuildingID,
            );

            assert.ok(building, 'unmapped building must be returned');
            assert.equal(building.location, null);
          },
        },

        {
          name: 'update building with no changes',

          async run(context) {
            const building = context.require(buildingKey);

            const response = await administrator(context).request.patch(
              `/buildings/${building.buildingId}`,
              {
                json: {},
              },
            );

            expectStatus(response, 200, 'update building with no changes');
            expectObject(response.body, 'update building with no changes');
            expectObject(response.body.building, 'unchanged building response');

            assert.equal(
              response.body.building.BuildingID,
              building.buildingId,
            );
            assert.equal(
              response.body.building.BuildingName,
              building.buildingName,
            );
          },
        },

        {
          name: 'reject duplicate building name update',

          async run(context) {
            const building = context.require(buildingKey);
            const conflictingBuilding = createBuilding({
              UniversityID: context.plan.university.UniversityID,
              BuildingName: 'Integration Conflicting Building',
            });

            await context.runtime.database
              .insert(Building)
              .values(conflictingBuilding);

            const response = await administrator(context).request.patch(
              `/buildings/${building.buildingId}`,
              {
                json: {
                  BuildingName: conflictingBuilding.BuildingName,
                },
              },
            );

            expectStatus(
              response,
              409,
              'reject duplicate building name update',
            );
          },
        },

        {
          name: 'unpin building location',

          async run(context) {
            const building = context.require(buildingKey);

            const response = await administrator(context).request.patch(
              `/buildings/${building.buildingId}`,
              {
                json: {
                  location: null,
                },
              },
            );

            expectStatus(response, 200, 'unpin building location');
            expectObject(response.body, 'unpin building location');
            expectObject(response.body.building, 'unpinned building');

            assert.equal(
              response.body.building.BuildingID,
              building.buildingId,
            );
            assert.equal(response.body.building.location, null);
          },
        },

        {
          name: 'get building heatmap with attendance',

          async run(context) {
            const building = context.require(buildingKey);
            const [venue] = await context.runtime.database
              .select()
              .from(Venue)
              .where(eq(Venue.BuildingID, building.buildingId))
              .limit(1);

            assert.ok(venue, 'building must have a seeded venue');

            const event = createEvent(undefined, {
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: '2026-01-02',
                startTime: '08:00',
                endTime: '09:00',
                moduleId: crypto.randomUUID(),
              },
            });
            const eventVenue = createEventVenue({
              EventID: event.eventID,
              VenueID: venue.VenueID,
            });

            const [user] = await context.runtime.database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, context.plan.email))
              .limit(1);

            assert.ok(user, 'authenticated test user must exist');

            const attendance = createAttendance({
              eventID: event.eventID,
              UserID: user.id,
              eventDate: '2026-01-02',
              state: 'ATTENDING',
            });

            await context.runtime.database.insert(Event).values(event);
            await context.runtime.database
              .insert(EventVenue)
              .values(eventVenue);
            await context.runtime.database
              .insert(EventAttendance)
              .values(attendance);

            const response = await administrator(context).request.get(
              `/buildings/${building.buildingId}/heatmap?date=${attendance.eventDate}&view=all`,
            );

            expectStatus(response, 200, 'get building heatmap');

            const body = response.body;
            expectObject(body, 'get building heatmap');

            const heatmapBuilding = body.building;
            expectObject(heatmapBuilding, 'heatmap building');

            const summary = body.summary;
            expectObject(summary, 'heatmap summary');

            assert.equal(body.date, attendance.eventDate);
            assert.ok(Array.isArray(body.venues));

            const heatmapVenue = (
              body.venues as Array<Record<string, unknown>>
            ).find((item) => item.VenueID === venue.VenueID);

            assert.ok(heatmapVenue, 'seeded venue must appear in heatmap');
            assert.equal(heatmapVenue.projected, 1);
            assert.equal(heatmapVenue.Capacity, venue.Capacity);
            assert.equal(heatmapVenue.actual, null);
          },
        },

        {
          name: 'get heatmap for all buildings',

          async run(context) {
            const building = context.require(buildingKey);
            const attendanceDate = '2026-01-02';

            const response = await administrator(context).request.get(
              `/buildings/heatmap?date=${attendanceDate}&view=projected`,
            );

            expectStatus(response, 200, 'get all buildings heatmap');

            const body = response.body;
            expectObject(body, 'get all buildings heatmap');

            const buildings = body.buildings;
            assert.ok(Array.isArray(buildings), 'buildings must be an array');
            assert.ok(
              buildings.length > 0,
              'at least one building heatmap expected',
            );

            const target = (buildings as Array<Record<string, unknown>>).find(
              (item) => {
                const itemBuilding = item.building as
                  Record<string, unknown> | undefined;
                return itemBuilding?.BuildingID === building.buildingId;
              },
            );

            assert.ok(target, 'seeded building must appear in the response');
            assert.equal(target.date, attendanceDate);
            assert.ok(Array.isArray(target.venues));
            assert.ok(Array.isArray(target.hourly));

            const summary = target.summary;
            expectObject(summary, 'heatmap summary');
          },
        },

        {
          name: 'reject deleting missing building',

          async run(context) {
            const response = await administrator(context).request.delete(
              '/buildings/00000000-0000-4000-8000-000000000099',
            );

            expectStatus(response, 404, 'delete missing building');
          },
        },
      ],
    },
    runtime,
  );
});
