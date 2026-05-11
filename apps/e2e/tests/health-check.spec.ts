import { test, expect } from "@playwright/test";

test.describe("Full Stack Health Check", () => {
  test("page loads the verification dashboard", async ({ page }) => {
    await page.goto("/");

    // Verify the title and key elements are visible
    await expect(page.locator("h1")).toContainText("UMTAS Stack Verification");
    await expect(page.locator("#hello-world-btn")).toBeVisible();
  });

  test("clicking Hello World button triggers full stack flow", async ({
    page,
  }) => {
    await page.goto("/");

    const button = page.locator("#hello-world-btn");
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Click the button
    await button.click();

    // Wait for the success result to appear (timeout: 15s for cold DB writes)
    const successResult = page.locator("#hello-success");
    await expect(successResult).toBeVisible({ timeout: 15000 });

    // Verify the success content
    await expect(successResult).toContainText("Full Stack Connected!");
    await expect(successResult).toContainText("Hello World");

    // Verify a UUID was returned (DB record ID)
    const dbRecordText = successResult.locator("code");
    await expect(dbRecordText).toBeVisible();
    const idText = await dbRecordText.textContent();
    // UUID v4 pattern
    expect(idText).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test("button can be clicked multiple times", async ({ page }) => {
    await page.goto("/");

    const button = page.locator("#hello-world-btn");

    // Click once
    await button.click();
    await expect(page.locator("#hello-success")).toBeVisible({
      timeout: 15000,
    });

    // Click again — should succeed with a new ID
    await button.click();
    await expect(page.locator("#hello-success")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("#hello-success")).toContainText(
      "Full Stack Connected!",
    );
  });
});
