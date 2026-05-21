/**
 * @jest-environment node
 */
import {
  getAllModulesBuilder,
  createModulesBuilder,
  getModulesByIdBuilder,
  updateModulesBuilder,
  deleteModulesById,
  createModuleReq,
  updateModuleByIdBody,
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

      expect(result.modules).toBeDefined();
      expect(Array.isArray(result.modules)).toBe(true);
    });
  });

  describe("Module CRUD Lifecycle", () => {
    it("should create, get, update, and delete a module", async () => {
      // create
      const createBuilder = new createModulesBuilder();
      const moduleCode = "COS222";
      if (sessionCookie) createBuilder.setHeaders({ Cookie: sessionCookie });

      const mockModule: createModuleReq = {
        code: moduleCode,
        name: "Lifecycle Test Module",
        description: "Created by integration test",
        styling: "#00FF00",
      };

      const createResult = await createBuilder.send({ body: mockModule });
      console.log("Create Response:", JSON.stringify(createResult, null, 2));
      const moduleId = createResult.module.moduleID;
      expect(moduleId).toBeDefined();

      // get by id
      const getBuilder = new getModulesByIdBuilder();
      if (sessionCookie) getBuilder.setHeaders({ Cookie: sessionCookie });

      const getResult = await getBuilder.send({ paths: { moduleId } });
      console.log("Get Response:", JSON.stringify(getResult, null, 2));
      expect(getResult.module.moduleID).toBe(moduleId);
      expect(getResult.module.moduleCode).toBe(mockModule.code);

      // update
      const updateBuilder = new updateModulesBuilder();
      if (sessionCookie) updateBuilder.setHeaders({ Cookie: sessionCookie });

      const updateBody: updateModuleByIdBody = {
        name: "Updated Lifecycle Name",
        styling: "#0000FF",
      };

      const updateResult = await updateBuilder.send({
        paths: { moduleId },
        body: updateBody,
      });
      console.log("Update Response:", JSON.stringify(updateResult, null, 2));
      expect(updateResult.module.moduleName).toBe(updateBody.name);
      expect(updateResult.module.styling).toBe(updateBody.styling);

      // delete
      const deleteBuilder = new deleteModulesById();
      if (sessionCookie) deleteBuilder.setHeaders({ Cookie: sessionCookie });

      const deleteResult = await deleteBuilder.send({
        paths: { moduleId },
      });
      console.log("Delete Response:", JSON.stringify(deleteResult, null, 2));
      expect(deleteResult.success).toBeDefined();
    });
  });
});
