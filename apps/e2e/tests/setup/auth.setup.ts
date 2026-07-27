import { test, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("authenticate Admin", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByLabel("Email")
    .fill(process.env.SEED_SYSTEM_ADMIN_EMAIL ?? "system-admin@local.umtas");
  await page
    .getByLabel("Password")
    .fill(process.env.SEED_SYSTEM_ADMIN_PASSWORD ?? "Admin@UMTAS2024!");

  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
  await page.context().storageState({ path: authFile });
});
