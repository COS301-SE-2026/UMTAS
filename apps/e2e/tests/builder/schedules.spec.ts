import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.skip("Create and update module", async ({ page }) => {
  await page.goto("/builder");
  await page.getByTestId("btn-add-new-Module").click();

  const moduleBtn = page.getByTestId("open-module-btn").first();
  await expect(moduleBtn).toBeVisible();
  await moduleBtn.click();

  const module = page.getByTestId("mod-container-div").first();
  await expect(module).toBeVisible();

  const moduleCodeInput = module.getByTestId("mod-Code-Input").first();
  await moduleCodeInput.fill("AA");

  const moduleNameInput = module.getByTestId("mod-Name-Input").first();
  await moduleNameInput.fill("AA");

  await page.getByTestId("mod-Confirm-Btn").first().click();

  const updatedModuleBtn = page
    .getByTestId("open-module-btn")
    .filter({ has: page.locator("p", { hasText: "AA" }) })
    .first();

  await expect(updatedModuleBtn).toBeVisible();
  await expect(updatedModuleBtn).toContainText("AA");
});

test.skip("Add Event", async ({ page }) => {
  await page.goto("/builder");
  await page.getByTestId("builder-Next-Step").click();
  const addEvent = page.getByTestId("event-add-btn");
  await addEvent.click();
  let eventContainer = page.getByTestId("builder-event-div");
  await eventContainer.getByTestId("event-open-btn").first().click();

  let event = eventContainer.getByTestId("event-card-div").first();
  await expect(event).toBeVisible();
  await event.getByTestId("event-Name-Input").fill("AA");
  await event.getByTestId("event-Code-Input").fill("AA");
  await event.getByTestId("event-Date-Input").fill("2026-12-30");
  await event.getByTestId("event-TimeStart-Select").click();
  await page.getByRole("option", { name: "07:00" }).click();
  await event.getByTestId("event-TimeEnd-Select").click();
  await page.getByRole("option", { name: "07:30" }).click();
  await event.getByTestId("event-Type-Select").click();
  await page.getByRole("option").first().click();
  await event.getByTestId("event-Module-Select").click();
  await page.getByRole("option").first().click();
  await page.getByTestId("event-Confirm-Btn").first().click();

  eventContainer = page.getByTestId("builder-event-div");
  await eventContainer.getByTestId("event-open-btn").first().click();
  event = await eventContainer.getByTestId("event-card-div").first();

  await expect(event).toBeVisible();
  await expect(event.getByTestId("event-Name-Input")).toHaveValue("AA");
  await expect(event.getByTestId("event-Code-Input")).toHaveValue("AA");
  await expect(event.getByTestId("event-Date-Input")).toHaveValue("2026-12-30");

  await expect(event.getByTestId("event-TimeStart-Select")).toHaveText("07:00");
  await expect(event.getByTestId("event-TimeEnd-Select")).toHaveText("07:30");

  await expect(event.getByTestId("event-Type-Select")).toHaveText("Lecture");
});

test.skip("Update event", async ({ page }) => {
  await page.goto("/builder");
  await page.getByTestId("builder-Next-Step").click();
  let eventContainer = page.getByTestId("builder-event-div");
  await eventContainer.getByTestId("event-open-btn").first().click();

  let event = eventContainer.getByTestId("event-card-div").first();
  await expect(event).toBeVisible();
  await event.getByTestId("event-Name-Input").fill("AA");
  await event.getByTestId("event-Code-Input").fill("AA");
  await event.getByTestId("event-Date-Input").fill("2026-12-30");
  await event.getByTestId("event-TimeStart-Select").click();
  await page.getByRole("option", { name: "07:00" }).click();
  await event.getByTestId("event-TimeEnd-Select").click();
  await page.getByRole("option", { name: "08:30" }).click();
  await event.getByTestId("event-Type-Select").click();
  await page.getByRole("option").last().click();
  await event.getByTestId("event-Module-Select").click();
  await page.getByRole("option").last().click();
  await page.getByTestId("event-Confirm-Btn").first().click();

  eventContainer = page.getByTestId("builder-event-div");
  await eventContainer.getByTestId("event-open-btn").first().click();
  event = await eventContainer.getByTestId("event-card-div").first();

  await expect(event).toBeVisible();
  await expect(event.getByTestId("event-Name-Input")).toHaveValue("AA");
  await expect(event.getByTestId("event-Code-Input")).toHaveValue("AA");
  await expect(event.getByTestId("event-Date-Input")).toHaveValue("2026-12-30");

  await expect(event.getByTestId("event-TimeStart-Select")).toHaveText("07:00");
  await expect(event.getByTestId("event-TimeEnd-Select")).toHaveText("08:30");

  await expect(event.getByTestId("event-Type-Select")).toHaveText("Test");
});

test.skip("Create schedule", async ({ page }) => {
  await page.goto("/builder");
  await page.getByTestId("builder-Next-Step").click();
  await page.getByTestId("builder-Next-Step").click(); // now on schedules edit page

  const createScheduleContainer = page.getByTestId("create-Schedule-Div");
  const TimetableNameInput = createScheduleContainer.getByTestId(
    "schedule-Timetable-Input",
  );
  await TimetableNameInput.fill("TestName");

  await page.waitForTimeout(1_000);
  const EventCheckBox = page
    .getByTestId("outer-schedule-div")
    .filter({ has: page.locator("p", { hasText: "AA" }) })
    .first()
    .getByTestId("schedule-Timetable-Checkbox")
    .first();

  await EventCheckBox.check();

  const createScheduleBtn = createScheduleContainer.getByTestId(
    "schedules-Create-Btn",
  );
  await createScheduleBtn.click();

  await expect(page.getByTestId("schedules-Calendar-Div")).toBeVisible();

  const dateInput = page.getByTestId("schedules-Date-Input");
  await dateInput.fill("2026-12-30");
  await dateInput.press("Enter");

  await expect(page.getByText("AA").first()).toBeVisible({ timeout: 15000 });
});

test.skip("Delete schedule", async ({ page }) => {
  await page.goto("/schedules");
  await page.getByTestId("schedules-Delete-Btn").click();
  await page.getByTestId("Schedules-ConfirmDelete-Btn").click();
  await expect(page.getByText("AA")).not.toBeVisible();
});

test.skip("Delete module", async ({ page }) => {
  await page.goto("/builder");

  const targetModule = page
    .getByTestId("open-module-btn")
    .filter({ has: page.locator("p", { hasText: "AA" }) })
    .first();

  await page.getByTestId("btn-delete-module").first().click();
  await expect(targetModule).not.toBeVisible();
});
