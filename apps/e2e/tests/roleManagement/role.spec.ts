import { expect, test } from "@playwright/test";

test("Roles Page Loads", async ({ page }) => {
  await page.goto("/role-management");
  await expect(page.getByText("Role Management")).toBeVisible();
});

test("Modules update module", async ({ page }) => {
  await page.goto("/role-management");
  const row = page
    .getByTestId("row-roles-table")
    .filter({ hasText: "Jannie Bloekom" });
  await row.getByTestId("select-user-role").click();
  await page.getByRole("option", { name: "REJECTED" }).click();
  await row.getByTestId("update-role-btn").click();
  await expect(page.getByText("REJECTED")).toBeVisible(); // role change occured

  await row.getByTestId("select-user-role").click();
  await page.getByRole("option", { name: "STUDENT" }).click();
  await row.getByTestId("update-role-btn").click();
});

//"select-user-role"
// "update-role-btn"
// "row-roles-table"
