import { test, expect } from "@playwright/test";
import path from "path";
test.describe.configure({ mode: "serial" });

test("Solver Page Loads", async ({ page }) => {
  await page.goto("/solver");
  await expect(page.getByText("Upload your timetable PDF")).toBeVisible();
});

test("Solver uploads", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/solver");
  const filePath = path.join(__dirname, "LECTURES_S1.pdf");

  const fileInput = page.getByTestId("input-file-pdf");
  await fileInput.setInputFiles(filePath);

  const uploadBtn = page.getByTestId("btn-upload-confirm");
  await expect(uploadBtn).toBeEnabled({ timeout: 30_000 });
  await uploadBtn.click();

  console.log("Post upload step");
  await expect(page.getByTestId("confirm-solver-events")).toBeVisible();
  await page.getByTestId("confirm-solver-events").click();

  await page.getByTestId("input-solver-timetable-name").fill("TestNameSolver");

  await page.getByTestId("btn-upload-and-create-timetable").click();

  await expect(page).toHaveURL("/schedules", { timeout: 30_000 });
  await page.getByTestId("schedules-Delete-Btn").click();
  await page.getByTestId("Schedules-ConfirmDelete-Btn").click();
});

//data-testid="confirm-solver-events"
