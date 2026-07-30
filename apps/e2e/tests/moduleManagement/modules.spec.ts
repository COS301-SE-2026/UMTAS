import { expect, test } from "@playwright/test";

test("Modules Page Loads", async ({ page }) => {
  await page.goto("/module-management");
  await expect(page.getByText("Module Management")).toBeVisible();
});

test("Modules update module", async ({ page }) => {
  await page.goto("/module-management");
  await page
    .getByTestId("modules-table-cell")
    .filter({ hasText: "COS151" })
    .click();
  await page.getByTestId("update-module-code").fill("COSTEST");
  await page.getByTestId("update-module-name").fill("updated Name");
  await page.getByTestId("save-changes-btn").click();

  await page.reload();

  await expect(page.getByText("COSTEST")).toBeVisible();
  await expect(page.getByText("updated Name")).toBeVisible();
  await page
    .getByTestId("modules-table-cell")
    .filter({ hasText: "COSTEST" })
    .click();

  await page.getByTestId("update-module-code").fill("COS151");
  await page
    .getByTestId("update-module-name")
    .fill("Introduction to computer science 151");
  await page.getByTestId("save-changes-btn").click();
});
