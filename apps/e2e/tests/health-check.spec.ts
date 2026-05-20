import { test, expect } from "@playwright/test";

test.describe("Full Stack Health Check", () => {
  test("frontend health endpoint is reachable", async ({ request }) => {
    const response = await request.get("http://localhost:3001/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ status: "ok" });
  });

  test("backend health endpoint is reachable", async ({ request }) => {
    const response = await request.get("http://localhost:3000/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ status: "ok" });
  });
});
