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

type StudentRoutingPlan = StudentPlan & {
  readonly university: typeof TEST_UNIVERSITY;
  readonly originBuildingName: string;
  readonly destinationBuildingName: string;
  readonly date: string;
};

type BuildingOutput = {
  readonly buildingId: string;
  readonly buildingName: string;
};

type VenueOutput = {
  readonly venueId: string;
  readonly venueName: string;
};

type EventOutput = {
  readonly eventId: string;
  readonly eventName: string;
};

let runtime: ReturnType<typeof createIntegrationHarness>;

beforeAll(() => {
  runtime = createIntegrationHarness();
});

afterAll(async () => {
  await runtime.close();
});

test('[flow:student-routing] returns student routes and alternatives', async () => {
  const plan: StudentRoutingPlan = {
    university: TEST_UNIVERSITY,
    email: uniqueStudentEmail('student-routing'),
    password: 'Student!Routing2026',
    name: 'Student Routing Test',
    originBuildingName: 'Origin Building',
    destinationBuildingName: 'Destination Building',
    date: '2026-01-02',
  };

  const student = (context: StepContext<StudentRoutingPlan>) =>
    context.actor('student');

  const universityKey = flowKey<UniversityOutput>('university.student-routing');
  const originBuildingKey = flowKey<BuildingOutput>(
    'building.student-routing.origin',
  );
  const destinationBuildingKey = flowKey<BuildingOutput>(
    'building.student-routing.destination',
  );
  const originVenueKey = flowKey<VenueOutput>('venue.student-routing.origin');
  const destinationVenueKey = flowKey<VenueOutput>(
    'venue.student-routing.destination',
  );
  const firstEventKey = flowKey<EventOutput>('event.student-routing.first');
  const secondEventKey = flowKey<EventOutput>('event.student-routing.second');

  const authentication = studentAuthenticationStep<StudentRoutingPlan>();

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
      name: 'student-routing',
      plan,

      seed: async ({ database, publish }) => {
        await seedTestUniversity(database, universityKey, publish);
      },

      steps: [
        authentication,
        adminSelection,

        //  Setup:
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

        //  db route
        {
          name: 'seed route between buildings',

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
              DistanceMetres: 120,
            });
            await context.runtime.database.insert(Route).values(route);
          },
        },

        //  Venues in each building
        {
          name: 'seed origin venue',
          outputKey: originVenueKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = context.require(originBuildingKey);
            const venue = createVenue({
              UniversityID: university.UniversityID,
              BuildingID: building.buildingId,
              VenueName: 'Origin Lecture Hall',
              Capacity: 100,
            });
            await context.runtime.database.insert(Venue).values(venue);

            return { venueId: venue.VenueID, venueName: venue.VenueName };
          },
        },

        {
          name: 'seed destination venue',
          outputKey: destinationVenueKey,

          async run(context) {
            const university = context.require(universityKey);
            const building = context.require(destinationBuildingKey);
            const venue = createVenue({
              UniversityID: university.UniversityID,
              BuildingID: building.buildingId,
              VenueName: 'Destination Lecture Hall',
              Capacity: 80,
            });
            await context.runtime.database.insert(Venue).values(venue);

            return { venueId: venue.VenueID, venueName: venue.VenueName };
          },
        },

        //  Events + attendance
        {
          name: 'seed first event at origin venue',
          outputKey: firstEventKey,

          async run(context) {
            const venue = context.require(originVenueKey);

            const event = createEvent(undefined, {
              eventName: 'First Lecture',
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: context.plan.date,
                startTime: '08:00',
                endTime: '10:00',
                moduleId: crypto.randomUUID(),
              },
            });
            const eventVenue = createEventVenue({
              EventID: event.eventID,
              VenueID: venue.venueId,
            });

            const [user] = await context.runtime.database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, context.plan.email))
              .limit(1);
            assert.ok(user, 'user must exist');

            const attendance = createAttendance({
              eventID: event.eventID,
              UserID: user.id,
              eventDate: context.plan.date,
              state: 'ATTENDING',
            });

            await context.runtime.database.insert(Event).values(event);
            await context.runtime.database
              .insert(EventVenue)
              .values(eventVenue);
            await context.runtime.database
              .insert(EventAttendance)
              .values(attendance);

            return { eventId: event.eventID, eventName: event.eventName };
          },
        },

        {
          name: 'seed second event at destination venue',
          outputKey: secondEventKey,

          async run(context) {
            const venue = context.require(destinationVenueKey);

            const event = createEvent(undefined, {
              eventName: 'Second Lecture',
              eventCriteria: {
                eventSource: EventSource.UNIVERSITY,
                date: context.plan.date,
                startTime: '10:30',
                endTime: '12:00',
                moduleId: crypto.randomUUID(),
              },
            });
            const eventVenue = createEventVenue({
              EventID: event.eventID,
              VenueID: venue.venueId,
            });

            const [user] = await context.runtime.database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, context.plan.email))
              .limit(1);
            assert.ok(user, 'user must exist');

            const attendance = createAttendance({
              eventID: event.eventID,
              UserID: user.id,
              eventDate: context.plan.date,
              state: 'ATTENDING',
            });

            await context.runtime.database.insert(Event).values(event);
            await context.runtime.database
              .insert(EventVenue)
              .values(eventVenue);
            await context.runtime.database
              .insert(EventAttendance)
              .values(attendance);

            return { eventId: event.eventID, eventName: event.eventName };
          },
        },

        //GEt /routes/student
        {
          name: 'get student routes for date',

          async run(context) {
            const firstEvent = context.require(firstEventKey);
            const secondEvent = context.require(secondEventKey);
            const originBuilding = context.require(originBuildingKey);

            const response = await student(context).request.get(
              `/routes/student?date=${context.plan.date}`,
            );

            expectStatus(response, 200, 'get student routes');

            const body = response.body;
            expectObject(body, 'get student routes');

            assert.equal(body.date, context.plan.date);
            assert.ok(Array.isArray(body.events), 'events must be an array');
            assert.ok(Array.isArray(body.routes), 'routes must be an array');
            assert.equal(body.events.length, 2);

            const eventIds = (
              body.events as Array<Record<string, unknown>>
            ).map((event) => event.eventId as string);

            assert.ok(
              eventIds.includes(firstEvent.eventId),
              'first event must appear in response',
            );
            assert.ok(
              eventIds.includes(secondEvent.eventId),
              'second event must appear in response',
            );

            assert.equal(body.routes.length, 1);

            const transition = (
              body.routes as Array<Record<string, unknown>>
            )[0];
            assert.equal(transition.sameBuilding, false);
            assert.ok(transition.route, 'transition must have a cached route');

            const route = transition.route as Record<string, unknown>;
            assert.equal(route.originBuildingId, originBuilding.buildingId);
          },
        },
        //GET /routes/student/alternatives
        {
          name: 'get alternative route between events',

          async run(context) {
            const firstEvent = context.require(firstEventKey);
            const secondEvent = context.require(secondEventKey);
            const origin = context.require(originBuildingKey);
            const destination = context.require(destinationBuildingKey);

            const response = await student(context).request.get(
              `/routes/student/alternatives?originEventId=${firstEvent.eventId}&destinationEventId=${secondEvent.eventId}&date=${context.plan.date}&routeIndex=0`,
            );

            expectStatus(response, 200, 'get alternative route');

            const body = response.body;
            expectObject(body, 'get alternative route');

            assert.equal(body.date, context.plan.date);
            assert.equal(body.originEventId, firstEvent.eventId);
            assert.equal(body.destinationEventId, secondEvent.eventId);
            assert.equal(body.originBuildingId, origin.buildingId);
            assert.equal(body.destinationBuildingId, destination.buildingId);

            const route = body.route;
            expectObject(route, 'alternative route');
            assert.equal(route.routeIndex, 0);
            assert.equal(route.isRecommended, true);
          },
        },

        //  Validation branches
        {
          name: 'reject alternatives when events are identical',

          async run(context) {
            const firstEvent = context.require(firstEventKey);

            const response = await student(context).request.get(
              `/routes/student/alternatives?originEventId=${firstEvent.eventId}&destinationEventId=${firstEvent.eventId}&date=${context.plan.date}&routeIndex=0`,
            );

            expectStatus(response, 400, 'reject identical events');
          },
        },

        {
          name: 'reject partial overrides in routes query',

          async run(context) {
            const firstEvent = context.require(firstEventKey);

            const response = await student(context).request.get(
              `/routes/student?date=${context.plan.date}&overrideOriginEventId=${firstEvent.eventId}`,
            );

            expectStatus(response, 400, 'reject partial overrides');
          },
        },

        {
          name: 'return empty routes when no attended events',

          async run(context) {
            const response = await student(context).request.get(
              '/routes/student?date=2026-12-31',
            );

            expectStatus(response, 200, 'get routes for empty date');

            const body = response.body;
            expectObject(body, 'get routes for empty date');

            assert.deepEqual(body.events, []);
            assert.deepEqual(body.routes, []);
          },
        },
      ],
    },
    runtime,
  );
});
