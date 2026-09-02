import test, { Page } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";
import { getLhConfig } from "./lighthouse.functions";

test("builder", async ({ page }) => {
  await page.goto("/builder");
  await playAudit(getLhConfig(page));
});
