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

type RouteStopPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly firstBuildingName: string;
  readonly secondBuildingName: string;
  readonly stopBuildingName: string;
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

test('[flow:route-stop] returns stop routes around a student schedule', async () => {
  const plan: RouteStopPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('route-stop'),
    password: 'Route!StopManagement2026',
    name: 'Route Stop Test Student',
    firstBuildingName: 'Integration Stop First Building',
    secondBuildingName: 'Integration Stop Second Building',
    stopBuildingName: 'Integration Stop Building',
  };

  const student = (context: StepContext<RouteStopPlan>) =>
    context.actor('student');

  const universityKey = flowKey<UniversityOutput>('university.route-stop');

  const firstBuildingKey = flowKey<BuildingOutput>('building.route-stop.first');

  const secondBuildingKey = flowKey<BuildingOutput>(
    'building.route-stop.second',
  );

  const stopBuildingKey = flowKey<BuildingOutput>('building.route-stop.stop');

  const firstVenueKey = flowKey<VenueOutput>('venue.route-stop.first');

  const secondVenueKey = flowKey<VenueOutput>('venue.route-stop.second');

  const authentication = studentAuthenticationStep<RouteStopPlan>();

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
      name: 'route-stop',
      plan,

      seed: async ({ database, publish }) => {
        await seedTestUniversity(database, universityKey, publish);
      },

      steps: [
        authentication,
        adminSelection,

        {
          //Seed first building
          name: 'seed first event building',
          outputKey: firstBuildingKey,

          async run(context) {
            const university = context.require(universityKey);

            const building = createBuilding({
              UniversityID: university.UniversityID,
              BuildingName: context.plan.firstBuildingName,
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
          //Seed second building
          name: 'seed second event building',
          outputKey: secondBuildingKey,

          async run(context) {
            const university = context.require(universityKey);

            const building = createBuilding({
              UniversityID: university.UniversityID,
              BuildingName: context.plan.secondBuildingName,
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

        {
          //seed the target stop building
          name: 'seed stop building',
          outputKey: stopBuildingKey,

          async run(context) {
            const university = context.require(universityKey);

            const building = createBuilding({
              UniversityID: university.UniversityID,
              BuildingName: context.plan.stopBuildingName,
              Latitude: -25.756,
              Longitude: 28.233,
            });

            await context.runtime.database.insert(Building).values(building);

            return {
              buildingId: building.BuildingID,
              buildingName: building.BuildingName,
            };
          },
        },

        {
          //Seed first venue
          name: 'seed first event venue',
          outputKey: firstVenueKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = context.require(firstBuildingKey);

            const venue = createVenue({
              UniversityID: university.UniversityID,
              BuildingID: building.buildingId,
              VenueName: 'Route Stop First Venue',
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
          //Seed second venue
          name: 'seed second event venue',
          outputKey: secondVenueKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = context.require(secondBuildingKey);

            const venue = createVenue({
              UniversityID: university.UniversityID,
              BuildingID: building.buildingId,
              VenueName: 'Route Stop Second Venue',
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
          //Seed route from first to stop building
          name: 'seed route from first building to stop',

          async run(context) {
            const university = context.require(universityKey);
            const first = context.require(firstBuildingKey);
            const stop = context.require(stopBuildingKey);

            const route = createRoute({
              UniversityID: university.UniversityID,
              OriginBuildingID: first.buildingId,
              DestinationBuildingID: stop.buildingId,
              RouteIndex: 0,
              PathCoordinates: [
                { lat: -25.7545, lng: 28.2314 },
                { lat: -25.756, lng: 28.233 },
              ],
              DistanceMetres: 200,
            });

            await context.runtime.database.insert(Route).values(route);
          },
        },

        {
          //Seed route from stop to second building
          name: 'seed route from stop to second building',

          async run(context) {
            const university = context.require(universityKey);
            const second = context.require(secondBuildingKey);
            const stop = context.require(stopBuildingKey);

            const route = createRoute({
              UniversityID: university.UniversityID,
              OriginBuildingID: stop.buildingId,
              DestinationBuildingID: second.buildingId,
              RouteIndex: 0,
              PathCoordinates: [
                { lat: -25.756, lng: 28.233 },
                { lat: -25.755, lng: 28.232 },
              ],
              DistanceMetres: 150,
            });

            await context.runtime.database.insert(Route).values(route);
          },
        },

        {
          //Seed events and attendance
          name: 'seed student events and attendance',

          async run(context) {
            const firstVenue = context.require(firstVenueKey);
            const secondVenue = context.require(secondVenueKey);

            const [user] = await context.runtime.database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, context.plan.email))
              .limit(1);

            assert.ok(user, 'authenticated user must exist');

            const firstEvent = createEvent(undefined, {
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: '2026-01-02',
                startTime: '08:00',
                endTime: '09:00',
                moduleId: crypto.randomUUID(),
              },
            });

            const secondEvent = createEvent(undefined, {
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: '2026-01-02',
                startTime: '10:30',
                endTime: '12:00',
                moduleId: crypto.randomUUID(),
              },
            });

            const firstAttendance = createAttendance({
              eventID: firstEvent.eventID,
              UserID: user.id,
              eventDate: '2026-01-02',
              state: 'ATTENDING',
            });

            const secondAttendance = createAttendance({
              eventID: secondEvent.eventID,
              UserID: user.id,
              eventDate: '2026-01-02',
              state: 'ATTENDING',
            });

            const firstEventVenue = createEventVenue({
              EventID: firstEvent.eventID,
              VenueID: firstVenue.venueId,
            });

            const secondEventVenue = createEventVenue({
              EventID: secondEvent.eventID,
              VenueID: secondVenue.venueId,
            });

            await context.runtime.database
              .insert(Event)
              .values([firstEvent, secondEvent]);

            await context.runtime.database
              .insert(EventAttendance)
              .values([firstAttendance, secondAttendance]);

            await context.runtime.database
              .insert(EventVenue)
              .values([firstEventVenue, secondEventVenue]);
          },
        },

        {
          //Largest gap when no time provided
          name: 'select largest gap when no time is supplied',

          async run(context) {
            const stop = context.require(stopBuildingKey);
            const first = context.require(firstBuildingKey);
            const second = context.require(secondBuildingKey);

            const response = await student(context).request.get(
              `/routes/stop-route?date=2026-01-02&buildingId=${stop.buildingId}`,
            );

            expectStatus(response, 200, 'largest gap stop route');

            const body = response.body;
            expectObject(body, 'largest gap stop route');

            assert.equal(body.date, '2026-01-02');
            assert.equal(body.buildingId, stop.buildingId);
            assert.equal(body.time, null);
            assert.equal(body.selectedWindow, '09:00-10:30');

            assert.ok(Array.isArray(body.legs));
            assert.equal(body.legs.length, 2);

            const toStop = body.legs.find(
              (leg: { direction: string }) => leg.direction === 'TO_STOP',
            );

            const fromStop = body.legs.find(
              (leg: { direction: string }) => leg.direction === 'FROM_STOP',
            );

            assert.ok(toStop, 'TO_STOP leg must exist');
            assert.ok(fromStop, 'FROM_STOP leg must exist');

            assert.equal(toStop.originEvent.buildingId, first.buildingId);

            assert.equal(
              fromStop.destinationEvent.buildingId,
              second.buildingId,
            );

            assert.ok(toStop.route, 'TO_STOP route must exist');
            assert.ok(fromStop.route, 'FROM_STOP route must exist');

            assert.equal(toStop.route.originBuildingId, first.buildingId);

            assert.equal(toStop.route.destinationBuildingId, stop.buildingId);

            assert.equal(fromStop.route.originBuildingId, stop.buildingId);

            assert.equal(
              fromStop.route.destinationBuildingId,
              second.buildingId,
            );
          },
        },

        {
          //Time provided during first event - should route after first event
          name: 'select current event and next event for time inside first event',

          async run(context) {
            const stop = context.require(stopBuildingKey);

            const response = await student(context).request.get(
              `/routes/stop-route?date=2026-01-02&time=08:30&buildingId=${stop.buildingId}`,
            );

            expectStatus(response, 200, 'stop route during first event');

            const body = response.body;
            expectObject(body, 'stop route during first event');

            assert.equal(body.selectedWindow, '09:00-10:30');
            assert.equal(body.time, '08:30');

            const legs = body.legs;
            assert.ok(Array.isArray(legs), 'legs must be an array');
            assert.equal(legs.length, 2);
          },
        },

        {
          //Time between two events
          name: 'select surrounding events for time between events',

          async run(context) {
            const stop = context.require(stopBuildingKey);
            const first = context.require(firstBuildingKey);
            const second = context.require(secondBuildingKey);

            const response = await student(context).request.get(
              `/routes/stop-route?date=2026-01-02&time=10:00&buildingId=${stop.buildingId}`,
            );

            expectStatus(response, 200, 'stop route between events');

            const body = response.body;
            expectObject(body, 'stop route between events');

            const legs = body.legs;
            assert.ok(Array.isArray(legs), 'legs must be an array');
            assert.equal(body.selectedWindow, '09:00-10:30');
            assert.equal(legs.length, 2);

            assert.equal(legs[0].originEvent.buildingId, first.buildingId);

            assert.equal(
              legs[1].destinationEvent.buildingId,
              second.buildingId,
            );
          },
        },

        {
          //Time provided before first event
          name: 'select first event when time is before first event',

          async run(context) {
            const stop = context.require(stopBuildingKey);
            const first = context.require(firstBuildingKey);

            const response = await student(context).request.get(
              `/routes/stop-route?date=2026-01-02&time=07:00&buildingId=${stop.buildingId}`,
            );

            expectStatus(response, 200, 'stop route before first event');

            const body = response.body;
            expectObject(body, 'stop route before first event');

            assert.equal(body.selectedWindow, 'before-08:00');

            const legs = body.legs;
            assert.ok(Array.isArray(legs), 'lgs must be an array');
            assert.equal(legs.length, 1);
            assert.equal(legs[0].direction, 'FROM_STOP');

            assert.equal(legs[0].destinationEvent.buildingId, first.buildingId);
          },
        },

        {
          //Time provided after last event
          name: 'select final event when time is after final event',

          async run(context) {
            const stop = context.require(stopBuildingKey);
            const second = context.require(secondBuildingKey);

            const response = await student(context).request.get(
              `/routes/stop-route?date=2026-01-02&time=13:00&buildingId=${stop.buildingId}`,
            );

            expectStatus(response, 200, 'stop route after final event');

            const body = response.body;
            expectObject(body, 'stop route after final event');

            assert.equal(body.selectedWindow, 'after-12:00');

            const legs = body.legs;
            assert.ok(Array.isArray(legs), 'lgs must be an array');
            assert.equal(legs.length, 1);
            assert.equal(legs[0].direction, 'TO_STOP');

            assert.equal(legs[0].originEvent.buildingId, second.buildingId);
          },
        },

        {
          //No evnts on date
          name: 'return not found when student has no events on date',

          async run(context) {
            const stop = context.require(stopBuildingKey);

            const response = await student(context).request.get(
              `/routes/stop-route?date=2026-01-03&buildingId=${stop.buildingId}`,
            );

            expectStatus(response, 404, 'stop route with no events');
          },
        },
      ],
    },
    runtime,
  );
});
