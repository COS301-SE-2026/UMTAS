import { expect, test } from "@playwright/test";

test("Roles Page Loads", async ({ page }) => {
  await page.goto("/role-management");

  await expect(page.getByText("Role Management")).toBeVisible();
});

test("Modules update module", async ({ page }) => {
  await page.goto("/role-management");

  const row = page
    .getByTestId("row-roles-table")
    .filter({
      has: page.getByTestId("select-user-role"),
    })
    .first();

  await expect(row).toBeVisible();

  await row.getByTestId("select-user-role").click();
  await page.getByRole("option", { name: "REJECTED" }).click();

  await row.getByTestId("update-role-btn").click();

  await expect(row.getByTestId("select-user-role")).toContainText("Rejected");

  await row.getByTestId("select-user-role").click();
  await page.getByRole("option", { name: "STUDENT" }).click();

  await row.getByTestId("update-role-btn").click();

  await expect(row.getByTestId("select-user-role")).toContainText("Student");
});

// "select-user-role"
// "update-role-btn"
// "row-roles-table"
