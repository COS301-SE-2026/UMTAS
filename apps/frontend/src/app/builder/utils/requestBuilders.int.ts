/**
 * @jest-environment node
 */
import {
  getAllModulesBuilder,
  createModulesBuilder,
  deleteModulesById,
  createModuleReq,
} from "./requestBuilders";

const apiUrl = process.env.API_URL || "http://localhost:3000";
const testEmail = process.env.SEED_SYSTEM_ADMIN_EMAIL;
const testPassword = process.env.SEED_SYSTEM_ADMIN_PASSWORD;

describe("Request Builders Integration Tests", () => {
  let sessionCookie = "";

  beforeAll(async () => {
    if (!testEmail || !testPassword) {
      console.warn(
        "TEST_USER_EMAIL or TEST_USER_PASSWORD not set, skipping login.",
      );
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

  describe("getAllModulesBuilder", () => {
    it("should return modules successfully", async () => {
      const builder = new getAllModulesBuilder();

      if (sessionCookie) {
        builder.setHeaders({ Cookie: sessionCookie });
      }

      const result = await builder.send({});
      console.log("getAllModules Response:", JSON.stringify(result, null, 2));

      expect(Array.isArray(result.modules)).toBe(true);
    });
  });

  describe("createModulesBuilder", () => {
    it("should create a module successfully", async () => {
      const builder = new createModulesBuilder();
      const deleteBuilder = new deleteModulesById();

      if (sessionCookie) {
        deleteBuilder.setHeaders({ Cookie: sessionCookie });
        builder.setHeaders({ Cookie: sessionCookie });
      }
      deleteBuilder.send({ paths: { moduleId: 2 } });
      const mockModule: createModuleReq = {
        code: `COS301`,
        name: "Integration Test Module",
        description: "Created by integration test",
        userId: "550e8400-e29b-41d4-a716-446655440000", // type expects it backend doesnt care
        styling: "#FF0000",
      };

      const result = await builder.send({ body: mockModule });
      console.log("createModules Response:", JSON.stringify(result, null, 2));

      expect(result.module).toBeDefined();
      expect(result.module.moduleCode).toBe(mockModule.code);
      expect(result.module.moduleName).toBe(mockModule.name);
    });
  });
});
