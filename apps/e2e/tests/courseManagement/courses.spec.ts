import { expect, test } from "@playwright/test";

test("Schedules Page Loads", async ({ page }) => {
  await page.goto("/course-management");
  await expect(page).toHaveScreenshot("CoursePageLoad.png");
});

test("Schedules Page add Course", async ({ page }) => {
  await page.goto("/course-management");
});
