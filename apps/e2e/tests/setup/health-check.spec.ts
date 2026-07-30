import { test, expect } from "@playwright/test";

test.describe("Full Stack Health Check", () => {
  test("frontend health endpoint is reachable", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ status: "ok" });
  });

  test("backend health endpoint is reachable", async ({ request }) => {
    const backendUrl = process.env.E2E_BACKEND_URL ?? "http://localhost:3000";
    const response = await request.get(`${backendUrl}/api/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ status: "ok" });
  });
});
