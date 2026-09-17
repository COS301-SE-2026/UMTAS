import assert from 'node:assert/strict';
import { flowKey, type StepContext } from '../framework/contracts';
import { runIntegrationFlow } from '../framework/flow-runner';
import { createIntegrationHarness } from '../framework/integration-harness';
import { expectObject, expectStatus } from '../steps/step-support';
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
  Route,
  usersTable,
  Venue,
} from 'src/entities';
import { eq } from 'drizzle-orm';
import {
  createAttendance,
  createBuilding,
  createEvent,
  createEventVenue,
  createRoute,
  createVenue,
} from 'src/Testing/Factories';
import { EventSource } from 'src/Events/dto/event.types';

type RoutingPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly originBuildingName: string;
  readonly destinationBuildingName: string;
  readonly venueName: string;
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

test('[flow:routing] returns routes and active route status', async () => {
  const plan: RoutingPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('routing'),
    password: 'Routing!Management2026',
    name: 'Routing Test Student',
    originBuildingName: 'Integration Origin Building',
    destinationBuildingName: 'Integration Destination Building',
    venueName: 'Integration Routing Venue',
  };

  const student = (context: StepContext<RoutingPlan>) =>
    context.actor('student');

  const universityKey = flowKey<UniversityOutput>('university.routing');
  const originBuildingKey = flowKey<BuildingOutput>('building.routing.origin');
  const destinationBuildingKey = flowKey<BuildingOutput>(
    'building.routing.destination',
  );
  const venueKey = flowKey<VenueOutput>('venue.routing');

  const authentication = studentAuthenticationStep<RoutingPlan>();

  const adminSelection = universityAdminSelectionStep(
    () => ({
      authenticationKey: authentication.outputKey,
      universityKey,
      calendarYear: new Date().getUTCFullYear(),
    }),
    student,
  );

  await runIntegrationFlow(
    {
      name: 'routing',
      plan,

      seed: async ({ database, publish }) => {
        await seedTestUniversity(database, universityKey, publish);
      },

      steps: [
        authentication,
        adminSelection,

        //  Seed two buildings
        {
          name: 'seed origin building',
          outputKey: originBuildingKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = createBuilding({
              UniversityID: university.UniversityID,
              BuildingName: context.plan.originBuildingName,
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

        {
          name: 'seed destination building',
          outputKey: destinationBuildingKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = createBuilding({
              UniversityID: university.UniversityID,
              BuildingName: context.plan.destinationBuildingName,
              Latitude: -25.755,
              Longitude: 28.232,
            });

            await context.runtime.database.insert(Building).values(building);

            return {
              buildingId: building.BuildingID,
              buildingName: building.BuildingName,
            };
          },
        },

        //  Cached route
        {
          name: 'seed cached route between buildings',

          async run(context) {
            const university = context.require(universityKey);
            const origin = context.require(originBuildingKey);
            const destination = context.require(destinationBuildingKey);

            const route = createRoute({
              UniversityID: university.UniversityID,
              OriginBuildingID: origin.buildingId,
              DestinationBuildingID: destination.buildingId,
              RouteIndex: 0,
              PathCoordinates: [
                { lat: -25.7545, lng: 28.2314 },
                { lat: -25.755, lng: 28.232 },
              ],
              DistanceMetres: 150,
            });

            await context.runtime.database.insert(Route).values(route);
          },
        },

        {
          name: 'retrieve cached route',

          async run(context) {
            const origin = context.require(originBuildingKey);
            const destination = context.require(destinationBuildingKey);

            const response = await student(context).request.get(
              `/routes?originBuildingId=${origin.buildingId}&destinationBuildingId=${destination.buildingId}`,
            );

            expectStatus(response, 200, 'retrieve route');

            const body = response.body;
            expectObject(body, 'retrieve route');

            const route = body.route;
            expectObject(route, 'retrieved route');

            assert.equal(route.originBuildingId, origin.buildingId);
            assert.equal(route.destinationBuildingId, destination.buildingId);
            assert.equal(route.routeIndex, 0);
          },
        },

        {
          name: 'retrieve reversed route',

          async run(context) {
            const origin = context.require(originBuildingKey);
            const destination = context.require(destinationBuildingKey);

            const response = await student(context).request.get(
              `/routes?originBuildingId=${destination.buildingId}&destinationBuildingId=${origin.buildingId}`,
            );

            expectStatus(response, 200, 'retrieve reversed route');

            const body = response.body;
            expectObject(body, 'retrieve reversed route');

            const route = body.route;
            expectObject(route, 'retrieved reversed route');

            assert.equal(route.originBuildingId, destination.buildingId);
            assert.equal(route.destinationBuildingId, origin.buildingId);
          },
        },

        {
          name: 'reject route with matching origin and destination',

          async run(context) {
            const origin = context.require(originBuildingKey);

            const response = await student(context).request.get(
              `/routes?originBuildingId=${origin.buildingId}&destinationBuildingId=${origin.buildingId}`,
            );

            expectStatus(response, 400, 'reject identical buildings');
          },
        },

        //  Active route
        {
          name: 'seed venue for routing',
          outputKey: venueKey,

          async run(context) {
            const university = context.require(universityKey);
            const origin = context.require(originBuildingKey);

            const venue = createVenue({
              UniversityID: university.UniversityID,
              BuildingID: origin.buildingId,
              VenueName: context.plan.venueName,
              Capacity: 100,
            });

            await context.runtime.database.insert(Venue).values(venue);

            return {
              venueId: venue.VenueID,
              venueName: venue.VenueName,
            };
          },
        },

        {
          name: 'return NONE when no events are attended',

          async run(context) {
            const response = await student(context).request.get(
              '/routes/active?date=2026-01-02&time=08:30',
            );

            expectStatus(response, 200, 'active route with no events');

            const body = response.body;
            expectObject(body, 'active route with no events');
            assert.equal(body.status, 'NONE');
          },
        },

        {
          name: 'return AT_VENUE when attending an in-progress event',

          async run(context) {
            const venue = context.require(venueKey);

            const [user] = await context.runtime.database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, context.plan.email))
              .limit(1);

            assert.ok(user, 'authenticated user must exist');

            const event = createEvent(undefined, {
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: '2026-01-02',
                startTime: '08:00',
                endTime: '10:00',
                moduleId: crypto.randomUUID(),
              },
            });

            const attendance = createAttendance({
              eventID: event.eventID,
              UserID: user.id,
              eventDate: '2026-01-02',
              state: 'ATTENDING',
            });

            const eventVenue = createEventVenue({
              EventID: event.eventID,
              VenueID: venue.venueId,
            });

            await context.runtime.database.insert(Event).values(event);
            await context.runtime.database
              .insert(EventAttendance)
              .values(attendance);
            await context.runtime.database
              .insert(EventVenue)
              .values(eventVenue);

            const response = await student(context).request.get(
              '/routes/active?date=2026-01-02&time=09:00',
            );

            expectStatus(response, 200, 'active route at venue');

            const body = response.body;
            expectObject(body, 'active route at venue');
            assert.equal(body.status, 'AT_VENUE');
            assert.equal(
              body.currentBuildingId,
              context.require(originBuildingKey).buildingId,
            );
          },
        },
        {
          name: 'return MOVING between consecutive events',

          async run(context) {
            const university = context.require(universityKey);
            const destination = context.require(destinationBuildingKey);

            const [user] = await context.runtime.database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, context.plan.email))
              .limit(1);

            assert.ok(user, 'authenticated user must exist');

            // Second event at the destination building, starting later
            const secondEvent = createEvent(undefined, {
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: '2026-01-02',
                startTime: '10:30',
                endTime: '12:00',
                moduleId: crypto.randomUUID(),
              },
            });

            const destinationVenue = createVenue({
              UniversityID: university.UniversityID,
              BuildingID: destination.buildingId,
              VenueName: 'Destination Routing Venue',
              Capacity: 60,
            });
            await context.runtime.database
              .insert(Venue)
              .values(destinationVenue);

            const attendance = createAttendance({
              eventID: secondEvent.eventID,
              UserID: user.id,
              eventDate: '2026-01-02',
              state: 'ATTENDING',
            });

            const eventVenue = createEventVenue({
              EventID: secondEvent.eventID,
              VenueID: destinationVenue.VenueID,
            });

            await context.runtime.database.insert(Event).values(secondEvent);
            await context.runtime.database
              .insert(EventAttendance)
              .values(attendance);
            await context.runtime.database
              .insert(EventVenue)
              .values(eventVenue);

            // Time between the two events
            const response = await student(context).request.get(
              '/routes/active?date=2026-01-02&time=10:15',
            );

            expectStatus(response, 200, 'active route moving');
            const body = response.body;
            expectObject(body, 'active route moving');
            assert.equal(body.status, 'MOVING');
            assert.equal(body.fromEventName, 'Lecture 1');
          },
        },
      ],
    },
    runtime,
  );
});
