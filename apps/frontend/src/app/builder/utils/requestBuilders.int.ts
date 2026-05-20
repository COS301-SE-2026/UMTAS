/**
 * @jest-environment node
 */
import { getAllModulesBuilder } from "./requestBuilders";

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

      console.log(
        "Builder Response (Success):",
        JSON.stringify(result, null, 2),
      );
      expect(Array.isArray(result.modules)).toBe(true);
    });
  });
});
