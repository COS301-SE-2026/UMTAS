import { test, expect } from "@playwright/test";

test("Create and update module", async ({ page }) => {
  await page.goto("/builder");
  await page.getByTestId("btn-add-new-Module").click();

  const moduleBtn = page.getByTestId("open-module-btn").first();
  await expect(moduleBtn).toBeVisible();
  await moduleBtn.click();

  const module = page.getByTestId("mod-container-div").first();
  await expect(module).toBeVisible();

  const moduleCodeInput = module.getByTestId("mod-Code-Input").first();
  await moduleCodeInput.fill("COS111");

  const moduleNameInput = module.getByTestId("mod-Name-Input").first();
  await moduleNameInput.fill("Updated");

  //assertions
  await page.getByTestId("mod-Confirm-Btn").first().click();
  await expect(moduleBtn).toContainText("Updated");
  await expect(moduleBtn).toContainText("COS111");
  await page.getByTestId("btn-delete-module").first().click();
  await expect(moduleBtn).not.toBeVisible();
});
