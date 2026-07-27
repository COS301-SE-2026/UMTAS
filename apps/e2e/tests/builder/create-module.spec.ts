import { test, expect } from "@playwright/test";

test("Create and update module", async ({ page }) => {
  await page.goto("http://localhost:3001/builder");
  await page.getByRole("button", { name: "Add Module" }).click();
  await page
    .getByRole("button", { name: /Module \d+/i })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Code" }).click();
  await page.getByRole("textbox", { name: "Code" }).fill("Cos301");
  await page.getByRole("textbox", { name: "Name" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Software Eng");
  await page.getByRole("radio", { name: "Sky" }).click();
  await page.getByRole("button", { name: "Confirm module" }).click();
});
