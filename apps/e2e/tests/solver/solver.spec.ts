import { test, expect } from "@playwright/test";
import path from "path";

test.describe.configure({ mode: "serial" });

test("Solver Page Loads", async ({ page }) => {
  await page.goto("/solver");
  await expect(page.getByText("Upload your timetable PDF")).toBeVisible();
});

test("Solver uploads", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/solver");

  const filePath = path.join(__dirname, "LECTURES_S1.pdf");

  const fileInput = page.getByTestId("input-file-pdf");
  const uploadBtn = page.getByTestId("btn-upload-confirm");
  const confirmEvents = page.getByTestId("confirm-solver-events");

  await fileInput.setInputFiles(filePath);

  await expect
    .poll(
      async () => {
        if (await confirmEvents.isVisible()) {
          return "complete";
        }

        if (await uploadBtn.isEnabled()) {
          return "upload";
        }

        return "waiting";
      },
      {
        timeout: 30_000,
      },
    )
    .not.toBe("waiting");

  if (await uploadBtn.isEnabled()) {
    await uploadBtn.click();
  }

  console.log("Post upload step");

  await expect(confirmEvents).toBeVisible({
    timeout: 60_000,
  });

  await confirmEvents.click();

  await page.getByTestId("input-solver-timetable-name").fill("TestNameSolver");

  await page.getByTestId("btn-upload-and-create-timetable").click();

  await expect(page).toHaveURL("/schedules", {
    timeout: 30_000,
  });

  await page.getByTestId("schedules-Delete-Btn").click();
  await page.getByTestId("Schedules-ConfirmDelete-Btn").click();
});

// data-testid="confirm-solver-events"
