import { test, expect } from "@playwright/test";
import path from "path";
test.describe.configure({ mode: "serial" });

test("Solver Page Loads", async ({ page }) => {
  await page.goto("/solver");
  await expect(page.getByText("Upload your timetable PDF")).toBeVisible();
});

test("Solver uploads", async ({ page }) => {
  await page.goto("/solver");
  const filePath = path.join(__dirname, "LECTURES_S1.pdf");

  const fileInput = page.getByTestId("input-file-pdf");
  await fileInput.setInputFiles(filePath);

  await page.waitForTimeout(5_000);

  const uploadBtn = page.getByTestId("btn-upload-confirm");
  const enabled = await uploadBtn.isEnabled();

  if (enabled) {
    await uploadBtn.click();
  } else {
    console.log("Upload button disabled, skipping click");
  }

  console.log("Post upload step");
  await expect(page.getByTestId("confirm-solver-events")).toBeVisible();
  await page.getByTestId("confirm-solver-events").click();

  await page.getByTestId("input-solver-timetable-name").fill("TestNameSolver");

  await page.getByTestId("btn-upload-and-create-timetable").click();

  await expect(page).toHaveURL("/schedules");
  await page.getByTestId("schedules-Delete-Btn").click();
  await page.getByTestId("Schedules-ConfirmDelete-Btn").click();
});

//data-testid="confirm-solver-events"
