import { expect, test } from "@playwright/test";

test("Courses Page Loads", async ({ page }) => {
  await page.goto("/course-management");
  await expect(page.getByText("Course Management")).toBeVisible();
});

test("Courses Page add Course", async ({ page }) => {
  await page.goto("/course-management");
  if (!(await page.getByText("TestName").isVisible())) {
    await page.getByTestId("show-add-course").click();
    await page.getByTestId("course-name-input").fill("TestName");
    await page.getByTestId("degree-name-input").fill("TestDegree");
    await page.getByTestId("add-course-confirm").click();
  }
  await expect(page.getByText("Course Management")).toBeVisible();
  await expect(page.getByText("TestName")).toBeVisible();
});
