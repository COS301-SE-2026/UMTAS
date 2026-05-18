import { test, expect } from "@playwright/test";

test.describe("Full Stack Health Check", () => {
  test("page loads the verification dashboard", async ({ page }) => {
    await page.goto("/");

    // Verify the title and key elements are visible
    await expect(page.locator("h1")).toContainText("UMTAS Stack Verification");
  });

  test("backend health endpoint is reachable", async ({ request }) => {
    const response = await request.get("http://localhost:3000/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ status: "ok" });
  });
});
