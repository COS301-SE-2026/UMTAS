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
import { Building, Venue } from 'src/entities';
import { eq } from 'drizzle-orm';
import { createBuilding, createVenue } from 'src/Testing/Factories';

type VenueManagementPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly buildingName: string;
  readonly venueName: string;
  readonly secondVenueName: string;
};

type BuildingOutput = {
  readonly buildingId: string;
  readonly buildingName: string;
};

type VenueOutput = {
  readonly venueId: string;
  readonly venueName: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:venue] manages venues and building assignments', async () => {
  const plan: VenueManagementPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('venue'),
    password: 'Venue!Management2026',
    name: 'Venue Management Administrator',
    buildingName: 'Integration Venue Building',
    venueName: 'Integration Lecture Hall',
    secondVenueName: 'Integration Tutorial Room',
  };

  const administrator = (context: StepContext<VenueManagementPlan>) =>
    context.actor('student');

  const universityKey = flowKey<UniversityOutput>('university.venue');
  const buildingKey = flowKey<BuildingOutput>('building.venue');
  const venueKey = flowKey<VenueOutput>('venue.venue');
  const secondVenueKey = flowKey<VenueOutput>('venue.second-venue');

  const authentication = studentAuthenticationStep<VenueManagementPlan>();

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
      name: 'venue management',
      plan,

      seed: async ({ database, publish }) => {
        await seedTestUniversity(database, universityKey, publish);
      },

      steps: [
        authentication,
        adminSelection,

        //Setup
        {
          name: 'seed building for venue tests',
          outputKey: buildingKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = createBuilding({
              UniversityID: university.UniversityID,
              BuildingName: context.plan.buildingName,
              Latitude: -25.7545,
              Longitude: 28.2314,
            });

            await context.runtime.database.insert(Building).values(building);

            return {
              buildingId: building.BuildingID,
              buildingName: building.BuildingName,
            };
          },
        },

        //  Create
        {
          name: 'create venue assigned to building',
          outputKey: venueKey,

          async run(context) {
            const building = context.require(buildingKey);
            const university = context.require(universityKey);
            const payload = createVenue({
              VenueName: context.plan.venueName,
              BuildingID: building.buildingId,
              Capacity: 120,
              UniversityID: university.UniversityID,
            });

            const response = await administrator(context).request.post(
              '/venues',
              {
                json: {
                  VenueName: payload.VenueName,
                  BuildingID: payload.BuildingID,
                  Capacity: payload.Capacity,
                },
              },
            );

            expectStatus(response, 201, 'create venue');

            const body = response.body;
            expectObject(body, 'create venue');

            const venue = body.venue;
            expectObject(venue, 'created venue');
            expectString(venue.VenueID, 'venue.VenueID');

            assert.equal(venue.VenueName, payload.VenueName);
            assert.equal(venue.BuildingID, building.buildingId);
            assert.equal(venue.Capacity, payload.Capacity);
            assert.equal(venue.UniversityID, university.UniversityID);

            const [persisted] = await context.runtime.database
              .select()
              .from(Venue)
              .where(eq(Venue.VenueID, venue.VenueID as string))
              .limit(1);

            assert.ok(persisted, 'venue must be persisted');
            assert.equal(persisted.BuildingID, building.buildingId);
            assert.equal(persisted.Capacity, payload.Capacity);

            return {
              venueId: venue.VenueID as string,
              venueName: venue.VenueName as string,
            };
          },
        },

        {
          name: 'create unassigned venue',
          outputKey: secondVenueKey,

          async run(context) {
            const university = context.require(universityKey);
            const payload = createVenue({
              VenueName: context.plan.secondVenueName,
              Capacity: 40,
              BuildingID: null,
              UniversityID: university.UniversityID,
            });

            const response = await administrator(context).request.post(
              '/venues',
              {
                json: {
                  VenueName: payload.VenueName,
                  Capacity: payload.Capacity,
                },
              },
            );

            expectStatus(response, 201, 'create unassigned venue');

            const body = response.body;
            expectObject(body, 'create unassigned venue');

            const venue = body.venue;
            expectObject(venue, 'created unassigned venue');

            assert.equal(venue.VenueName, payload.VenueName);
            assert.equal(venue.BuildingID, null);
            assert.equal(venue.Capacity, payload.Capacity);

            return {
              venueId: venue.VenueID as string,
              venueName: venue.VenueName as string,
            };
          },
        },

        //  GetById
        {
          name: 'retrieve venue',

          async run(context) {
            const venue = context.require(venueKey);

            const response = await administrator(context).request.get(
              `/venues/${venue.venueId}`,
            );

            expectStatus(response, 200, 'retrieve venue');

            const body = response.body;
            expectObject(body, 'retrieve venue');

            const fetched = body.venue;
            expectObject(fetched, 'retrieved venue');

            assert.equal(fetched.VenueID, venue.venueId);
            assert.equal(fetched.VenueName, venue.venueName);
          },
        },

        {
          name: 'reject retrieve for missing venue',

          async run(context) {
            const response = await administrator(context).request.get(
              '/venues/00000000-0000-4000-8000-000000000099',
            );

            expectStatus(response, 404, 'retrieve missing venue');
          },
        },

        //  GetAll
        {
          name: 'list all venues for university',

          async run(context) {
            const response =
              await administrator(context).request.get('/venues');

            expectStatus(response, 200, 'list venues');

            const body = response.body;
            expectObject(body, 'list venues');
            assert.ok(Array.isArray(body.venues));

            assert.ok(
              (body.venues as Array<Record<string, unknown>>).some(
                (item) => item.VenueID === context.require(venueKey).venueId,
              ),
              'assigned venue must appear in list',
            );
          },
        },

        {
          name: 'list venues filtered by buildingId',

          async run(context) {
            const building = context.require(buildingKey);
            const venue = context.require(venueKey);

            const response = await administrator(context).request.get(
              `/venues?buildingId=${encodeURIComponent(building.buildingId)}`,
            );

            expectStatus(response, 200, 'list venues by building');

            const body = response.body;
            expectObject(body, 'list venues by building');
            assert.ok(Array.isArray(body.venues));

            const venues = body.venues as Array<Record<string, unknown>>;

            assert.ok(
              venues.some(
                (item) =>
                  item.VenueID === venue.venueId &&
                  item.BuildingID === building.buildingId,
              ),
              'assigned venue must appear for its building',
            );

            assert.ok(
              venues.every((item) => item.BuildingID === building.buildingId),
              'building filter must exclude venues from other buildings',
            );
          },
        },

        {
          name: 'list mapped and unmapped venues',

          async run(context) {
            const mappedResponse = await administrator(context).request.get(
              '/venues?mapped=true',
            );
            expectStatus(mappedResponse, 200, 'list mapped venues');

            const mappedBody = mappedResponse.body;
            expectObject(mappedBody, 'list mapped venues');
            assert.ok(Array.isArray(mappedBody.venues));

            assert.ok(
              (mappedBody.venues as Array<Record<string, unknown>>).some(
                (item) => item.VenueID === context.require(venueKey).venueId,
              ),
              'assigned venue must be mapped',
            );

            const unmappedResponse = await administrator(context).request.get(
              '/venues?mapped=false',
            );
            expectStatus(unmappedResponse, 200, 'list unmapped venues');

            const unmappedBody = unmappedResponse.body;
            expectObject(unmappedBody, 'list unmapped venues');
            assert.ok(Array.isArray(unmappedBody.venues));

            assert.ok(
              (unmappedBody.venues as Array<Record<string, unknown>>).some(
                (item) =>
                  item.VenueID === context.require(secondVenueKey).venueId,
              ),
              'unassigned venue must be unmapped',
            );
          },
        },

        {
          name: 'list venues filtered by search',

          async run(context) {
            const venue = context.require(venueKey);

            const response = await administrator(context).request.get(
              `/venues?search=${encodeURIComponent(venue.venueName.slice(0, 4))}`,
            );

            expectStatus(response, 200, 'list venues by search');

            const body = response.body;
            expectObject(body, 'list venues by search');
            assert.ok(Array.isArray(body.venues));

            assert.ok(
              (body.venues as Array<Record<string, unknown>>).some(
                (item) => item.VenueID === venue.venueId,
              ),
              'search must return the created venue',
            );
          },
        },

        //  Create: validation branches
        {
          name: 'reject duplicate venue name',

          async run(context) {
            const response = await administrator(context).request.post(
              '/venues',
              {
                json: {
                  VenueName: context.plan.venueName,
                  Capacity: 50,
                },
              },
            );

            expectStatus(response, 409, 'reject duplicate venue');
          },
        },

        {
          name: 'reject create with missing building',

          async run(context) {
            const response = await administrator(context).request.post(
              '/venues',
              {
                json: {
                  VenueName: `${context.plan.venueName}`,
                  BuildingID: '00000000-0000-4000-8000-000000000099',
                  Capacity: 50,
                },
              },
            );

            expectStatus(response, 404, 'reject venue with missing building');
          },
        },

        {
          name: 'reject invalid venue payload',

          async run(context) {
            const response = await administrator(context).request.post(
              '/venues',
              {
                json: { VenueName: '', Capacity: -1 },
              },
            );

            expectStatus(response, 400, 'reject invalid venue');
          },
        },

        //  Update
        {
          name: 'update venue capacity and assignment',

          async run(context) {
            const venue = context.require(venueKey);
            const building = context.require(buildingKey);

            const response = await administrator(context).request.patch(
              `/venues/${venue.venueId}`,
              {
                json: {
                  Capacity: 200,
                  BuildingID: building.buildingId,
                },
              },
            );

            expectStatus(response, 200, 'update venue');

            const body = response.body;
            expectObject(body, 'update venue');

            const updated = body.venue;
            expectObject(updated, 'updated venue');

            assert.equal(updated.VenueID, venue.venueId);
            assert.equal(updated.Capacity, 200);
            assert.equal(updated.BuildingID, building.buildingId);
          },
        },

        {
          name: 'update venue with no changes returns early',

          async run(context) {
            const venue = context.require(venueKey);

            const response = await administrator(context).request.patch(
              `/venues/${venue.venueId}`,
              { json: { VenueName: venue.venueName } },
            );

            expectStatus(response, 200, 'update venue no-op');

            const body = response.body;
            expectObject(body, 'update venue no-op');

            const unchanged = body.venue;
            expectObject(unchanged, 'unchanged venue');

            assert.equal(unchanged.VenueName, venue.venueName);
          },
        },

        {
          name: 'reject update with duplicate name',

          async run(context) {
            const venue = context.require(secondVenueKey);

            const response = await administrator(context).request.patch(
              `/venues/${venue.venueId}`,
              { json: { VenueName: context.plan.venueName } },
            );

            expectStatus(response, 409, 'reject duplicate name on update');
          },
        },

        {
          name: 'unassign venue from building',

          async run(context) {
            const venue = context.require(secondVenueKey);

            const response = await administrator(context).request.patch(
              `/venues/${venue.venueId}`,
              { json: { BuildingID: null } },
            );

            expectStatus(response, 200, 'unassign venue');

            const body = response.body;
            expectObject(body, 'unassign venue');

            const unassigned = body.venue;
            expectObject(unassigned, 'unassigned venue');

            assert.equal(unassigned.BuildingID, null);
          },
        },

        {
          name: 'reject update for missing venue',

          async run(context) {
            const response = await administrator(context).request.patch(
              '/venues/00000000-0000-4000-8000-000000000099',
              { json: { Capacity: 10 } },
            );

            expectStatus(response, 404, 'update missing venue');
          },
        },

        //  Bulk assign
        {
          name: 'assign venue using bulk assignment',

          async run(context) {
            const venue = context.require(secondVenueKey);
            const building = context.require(buildingKey);

            const response = await administrator(context).request.post(
              '/venues/assign',
              {
                json: {
                  assignments: [
                    {
                      venueId: venue.venueId,
                      buildingId: building.buildingId,
                    },
                  ],
                },
              },
            );

            expectStatus(response, 200, 'assign venue to building');

            const body = response.body;
            expectObject(body, 'assign venue to building');
            assert.equal(body.success, true);
            assert.equal(body.updated, 1);

            const fetchedResponse = await administrator(context).request.get(
              `/venues/${venue.venueId}`,
            );

            const fetchedBody = fetchedResponse.body;
            expectObject(fetchedBody, 'retrieve assigned venue');

            const fetched = fetchedBody.venue;
            expectObject(fetched, 'retrieved assigned venue');

            assert.equal(fetched.BuildingID, building.buildingId);
          },
        },

        {
          name: 'reject bulk assign with invalid building',

          async run(context) {
            const response = await administrator(context).request.post(
              '/venues/assign',
              {
                json: {
                  assignments: [
                    {
                      venueId: context.require(venueKey).venueId,
                      buildingId: '00000000-0000-4000-8000-000000000099',
                    },
                  ],
                },
              },
            );

            expectStatus(response, 400, 'reject invalid building on assign');
          },
        },

        {
          name: 'unassign venues via bulk assign with null buildingId',

          async run(context) {
            const venue = context.require(secondVenueKey);

            const response = await administrator(context).request.post(
              '/venues/assign',
              {
                json: {
                  assignments: [{ venueId: venue.venueId, buildingId: null }],
                },
              },
            );

            expectStatus(response, 200, 'bulk unassign');

            const body = response.body;
            expectObject(body, 'bulk unassign');
            assert.equal(body.updated, 1);
          },
        },

        //  Delete
        {
          name: 'delete venue',

          async run(context) {
            const venue = context.require(venueKey);

            const response = await administrator(context).request.delete(
              `/venues/${venue.venueId}`,
            );

            expectStatus(response, 200, 'delete venue');

            const body = response.body;
            expectObject(body, 'delete venue');

            const deleted = body.venue;
            expectObject(deleted, 'deleted venue');
            assert.equal(deleted.VenueID, venue.venueId);

            const [persisted] = await context.runtime.database
              .select()
              .from(Venue)
              .where(eq(Venue.VenueID, venue.venueId))
              .limit(1);

            assert.equal(
              persisted,
              undefined,
              'deleted venue must not remain in DB',
            );
          },
        },

        {
          name: 'reject delete for missing venue',

          async run(context) {
            const response = await administrator(context).request.delete(
              '/venues/00000000-0000-4000-8000-000000000099',
            );

            expectStatus(response, 404, 'delete missing venue');
          },
        },
      ],
    },
    runtime,
  );
});
