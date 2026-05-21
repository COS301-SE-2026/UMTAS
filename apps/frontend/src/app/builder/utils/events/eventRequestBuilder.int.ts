/**
 * @jest-environment node
 */
import {
  createEventsBuilder,
  getAllEventsBuilder,
  getEventByIDBuilder,
  updateEventByID,
  deleteEventById,
  CreateEventBody,
} from "./eventRequestBuilder";

import {
  createModulesBuilder,
  deleteModulesById,
  createModuleReq,
} from "../modules/requestBuilders";

// require("dotenv").config({ path: "../../../../../.env" });

const apiUrl =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";
const testEmail = process.env.SEED_SYSTEM_ADMIN_EMAIL;
const testPassword = process.env.SEED_SYSTEM_ADMIN_PASSWORD;

describe("Event Request Builders Integration Tests", () => {
  let sessionCookie = "";

  beforeAll(async () => {
    // console.log("EMAIL:", testEmail);
    // console.log("API:", apiUrl);

    if (!testEmail || !testPassword) {
      console.warn("TEST_USER_EMAIL or TEST_USER_PASSWORD not set");
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

  //return all events
  it("should return all events successfully", async () => {
    const builder = new getAllEventsBuilder();
    auth(builder);

    const result = await builder.send({});

    expect(result.events).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
    // expect(4).toEqual(4);
  });

  it("should create, get, update, and delete an event", async () => {
    const moduleCode = `COS332`;

    const moduleBuilder = new createModulesBuilder();
    auth(moduleBuilder);

    const mockModule: createModuleReq = {
      code: moduleCode,
      name: "Event Test Module",
      description: "Module created for event integration test",
      styling: "#00FF00",
    };

    const createdModule = await moduleBuilder.send({ body: mockModule });
    const moduleId = createdModule.module.moduleID;

    const createBuilder = new createEventsBuilder();
    auth(createBuilder);

    const eventBody: CreateEventBody = {
      name: "Lifecycle Test Event",
      code: `TEST-code`,
      isRecurring: false,
      eventCriteria: {
        day: "monday",
        startTime: "08:00",
        endTime: "09:00",
        type: "lecture",
        venue: "IT 2-26",
        moduleCode: moduleCode,
      },
    };

    const created = await createBuilder.send({ body: eventBody });
    const eventId = created.event.eventID;

    expect(eventId).toBeDefined();

    const getBuilder = new getEventByIDBuilder();
    auth(getBuilder);

    const found = await getBuilder.send({ paths: { id: eventId } });

    expect(found.event.eventID).toBe(eventId);
    expect(found.event.name).toBe(eventBody.name);

    const updateBuilder = new updateEventByID();
    auth(updateBuilder);

    const updated = await updateBuilder.send({
      paths: { id: eventId },
      body: {
        name: "Updated Lifecycle Event",
        isRecurring: false,
      },
    });

    expect(updated.event.name).toBe("Updated Lifecycle Event");

    const deleteBuilder = new deleteEventById();
    auth(deleteBuilder);

    const deleted = await deleteBuilder.send({ paths: { id: eventId } });

    expect(deleted.success).toBeDefined();

    //delete module
    const deleteModuleBuilder = new deleteModulesById();
    auth(deleteModuleBuilder);

    await deleteModuleBuilder.send({ paths: { moduleId } });
  });
});
