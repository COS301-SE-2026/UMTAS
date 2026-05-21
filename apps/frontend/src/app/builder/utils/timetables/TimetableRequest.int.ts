import {
  createTimeTableBuilder,
  getAllTimeTablesBuilder,
} from "./TimeTableRequests";

import { createEventsBuilder } from "../events/eventRequestBuilder";
// import { auth } from "../../../../../utilities/auth";
import {
  createModulesBuilder,
  createModuleReq,
  deleteModulesById,
} from "../modules/requestBuilders";

const apiUrl =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";
const testEmail = process.env.SEED_SYSTEM_ADMIN_EMAIL;
const testPassword = process.env.SEED_SYSTEM_ADMIN_PASSWORD;

// require("dotenv").config({ path: "../../../../../.env" });

describe("TimetableRequest Integration test", () => {
  let sessionCookie = "";

  beforeAll(async () => {
    if (!testEmail || !testPassword) {
      console.warn("TEST_USER_EMAIL or TEST_USER_PASSWORD not found");
      return;
    }

    const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: apiUrl,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Login failed with status ${response.status}: ${errorBody}`,
      );
    }

    const cookies = response.headers.getSetCookie();
    sessionCookie = cookies.map((c) => c.split(";")[0]).join("; ");
  });

  const auth = (builder: {
    setHeaders: (h: Record<string, string>) => unknown;
  }) => {
    if (sessionCookie) builder.setHeaders({ Cookie: sessionCookie });
  };

  //return all timetables
  it("should return all timetables successfully", async () => {
    const builder = new getAllTimeTablesBuilder();
    auth(builder);

    const result = await builder.send({});

    expect(result.timetables).toBeDefined();
    expect(Array.isArray(result.timetables)).toBe(true);
  });

  it("should create timetable with event", async () => {
    const moduleCode = `COS111`;

    // create module
    const mBuilder = new createModulesBuilder();
    auth(mBuilder);

    const mockModule: createModuleReq = {
      code: moduleCode,
      name: "test module",
      description: "for testing",
      styling: "#939393",
    };

    const createdModule = await mBuilder.send({
      body: mockModule,
    });

    const moduleId = createdModule.module.moduleID;

    // create event
    const eventBuilder = new createEventsBuilder();
    auth(eventBuilder);

    const createdEvent = await eventBuilder.send({
      body: {
        name: "Timetable Test Event",
        code: `EVentCode`,
        isRecurring: false,
        eventCriteria: {
          day: "monday",
          startTime: "08:00",
          endTime: "09:00",
          type: "lecture",
          venue: "IT 2-26",
          moduleCode,
        },
      },
    });

    const eventId = createdEvent.event.eventID;

    expect(eventId).toBeDefined();

    // create timetable
    const timetableBuilder = new createTimeTableBuilder();
    auth(timetableBuilder);

    const createdTimetable = await timetableBuilder.send({
      body: {
        timetableName: "Integration Test Timetable",
        eventIds: [String(eventId)],
      },
    });

    expect(createdTimetable.timetable).toBeDefined();
    expect(createdTimetable.timetable.timetableID).toBeDefined();

    // verify get all
    const getBuilder = new getAllTimeTablesBuilder();
    auth(getBuilder);

    const allTimetables = await getBuilder.send({});

    expect(Array.isArray(allTimetables.timetables)).toBe(true);

    // cleanup module
    const deleteModuleBuilder = new deleteModulesById();
    auth(deleteModuleBuilder);

    await deleteModuleBuilder.send({
      paths: { moduleId },
    });
  });
});
