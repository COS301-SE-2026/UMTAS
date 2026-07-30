import { test, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test.describe.configure({ mode: "serial" });

test("authenticate Admin", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.SEED_SYSTEM_ADMIN_EMAIL ?? "system-admin@local.umtas");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_SYSTEM_ADMIN_PASSWORD ?? "Admin@UMTAS2024!");

  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
  await page.context().storageState({ path: authFile });
});

test("Choose institute", async ({ page }) => {
  await page.goto("/dashboard");
  const instituteDiv = page.getByTestId("dashboard-popup-div");
  await instituteDiv.getByTestId("institute-select-Uni").click();
  await page.getByRole("option", { name: "University of Pretoria" }).click();
  await instituteDiv.getByTestId("btn-continue").click();
  await page.context().storageState({ path: authFile });
});
