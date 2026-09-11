import { expect, test } from "@playwright/test";

type ResTypes =
  | "SEMESTER_1_START"
  | "SEMESTER_1_END"
  | "SEMESTER_2_START"
  | "SEMESTER_2_END"
  | "HOLIDAY"
  | "PUBLIC_HOLIDAY"
  | "UNIVERSITY_CLOSURE"
  | "RECESS"
  | "TEST_WEEK"
  | "EXAM_PERIOD"
  | "SUPP_WEEK"
  | "DAY_SWAP";
test.describe.configure({ mode: "serial" });

test("Calendar Page Loads", async ({ page }) => {
  await page.goto("/calendar-management");
  await expect(page.getByText("Calendar Management")).toBeVisible();
});

test("Calendar Page add Calendar year", async ({ page }) => {
  await page.goto("/calendar-management");
  await page.getByTestId("SELECT_NEW_YEAR").click();
  await page.getByRole("option", { name: "2030" }).click();
  await expect(page.getByText("2030")).toBeVisible();
});

test("Calendar Page add Restriction holiday", async ({ page }) => {
  await page.goto("/calendar-management");
  await page.getByTestId("SELECT_NEW_YEAR").click();
  await page.getByRole("option", { name: "2030" }).click();
  await expect(page.getByText("2030")).toBeVisible();

  const SingleDateType: ResTypes = "PUBLIC_HOLIDAY";

  await page.getByTestId(`CREATE_RESTRICTION`).click();
  await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

  await expect(
    page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-Date-Input"),
  ).toBeVisible();

  await expect(
    page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-dsc-Input"),
  ).toBeVisible();

  await page
    .getByTestId("TEMP_CONTAINER")
    .getByTestId("restriction-Date-Input")
    .fill("2030-12-30");

  await page
    .getByTestId("TEMP_CONTAINER")
    .getByTestId("restriction-dsc-Input")
    .fill("Test Holiday");

  await page
    .getByTestId("TEMP_CONTAINER")
    .getByTestId("btn-save-restriction")
    .click();

  await expect(
    page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-dsc-Input"),
  ).toHaveValue("Test Holiday");

  await page
    .getByTestId("ADDED_CONTAINER")
    .getByTestId("btn-delete-restriction")
    .click();
});
