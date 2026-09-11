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

test.describe("Calendar", () => {
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

  test("Calendar Page add Restriction SingleDate", async ({ page }) => {
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
    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-Date-Input"),
    ).toHaveValue("2030-12-30");
    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-delete-restriction")
      .click();
  });

  test("Calendar Page add Restriction Range", async ({ page }) => {
    await page.goto("/calendar-management");
    await page.getByTestId("SELECT_NEW_YEAR").click();
    await page.getByRole("option", { name: "2030" }).click();
    await expect(page.getByText("2030")).toBeVisible();

    const SingleDateType: ResTypes = "RECESS";

    await page.getByTestId(`CREATE_RESTRICTION`).click();
    await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

    await expect(
      page
        .getByTestId("TEMP_CONTAINER")
        .getByTestId("restriction-Date-Input-start"),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("TEMP_CONTAINER")
        .getByTestId("restriction-Date-Input-end"),
    ).toBeVisible();

    await expect(
      page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toBeVisible();

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input-start")
      .fill("2030-10-10");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input-end")
      .fill("2030-10-12");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test Range");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();

    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toHaveValue("Test Range");
    await expect(
      page
        .getByTestId("ADDED_CONTAINER")
        .getByTestId("restriction-Date-Input-start"),
    ).toHaveValue("2030-10-10");
    await expect(
      page
        .getByTestId("ADDED_CONTAINER")
        .getByTestId("restriction-Date-Input-end"),
    ).toHaveValue("2030-10-12");
    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-delete-restriction")
      .click();
  });

  test("Calendar Page add Restriction Day swap", async ({ page }) => {
    await page.goto("/calendar-management");
    await page.getByTestId("SELECT_NEW_YEAR").click();
    await page.getByRole("option", { name: "2030" }).click();
    await expect(page.getByText("2030")).toBeVisible();

    const SingleDateType: ResTypes = "DAY_SWAP";

    await page.getByTestId(`CREATE_RESTRICTION`).click();
    await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

    await expect(
      page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-Date-Input"),
    ).toBeVisible();

    await expect(
      page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toBeVisible();
    await page.getByTestId("SELECT_DAY").click();
    await page.getByRole("option", { name: "Wednesday" }).click();

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input")
      .fill("2030-12-30");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test DAYSWAP");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();

    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toHaveValue("Test DAYSWAP");
    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-Date-Input"),
    ).toHaveValue("2030-12-30");

    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("SELECT_DAY"),
    ).toHaveText("wednesday");

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-delete-restriction")
      .click();
  });

  test("Calendar Page update Restriction SingleDate", async ({ page }) => {
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

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("restriction-Date-Input")
      .fill("2030-10-31");

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test Holiday UPDATED");

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();

    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toHaveValue("Test Holiday UPDATED");
    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-Date-Input"),
    ).toHaveValue("2030-10-31");

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-delete-restriction")
      .click();
  });

  test("Calendar Page update Restriction Day swap", async ({ page }) => {
    await page.goto("/calendar-management");
    await page.getByTestId("SELECT_NEW_YEAR").click();
    await page.getByRole("option", { name: "2030" }).click();
    await expect(page.getByText("2030")).toBeVisible();

    const SingleDateType: ResTypes = "DAY_SWAP";

    await page.getByTestId(`CREATE_RESTRICTION`).click();
    await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

    await expect(
      page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-Date-Input"),
    ).toBeVisible();

    await expect(
      page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toBeVisible();

    await page.getByTestId("SELECT_DAY").click();
    await page.getByRole("option", { name: "Wednesday" }).click();

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input")
      .fill("2030-12-30");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test DAYSWAP");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();

    // updates ---------------------------------
    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("restriction-Date-Input")
      .fill("2030-10-30");

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test DAYSWAP UPDATED");

    await page.getByTestId("ADDED_CONTAINER").getByTestId("SELECT_DAY").click();
    await page.getByRole("option", { name: "Thursday" }).click();

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();

    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toHaveValue("Test DAYSWAP UPDATED");
    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-Date-Input"),
    ).toHaveValue("2030-10-30");

    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("SELECT_DAY"),
    ).toHaveText("thursday");

    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-delete-restriction")
      .click();
  });

  test("Calendar Page update Restriction Range", async ({ page }) => {
    await page.goto("/calendar-management");
    await page.getByTestId("SELECT_NEW_YEAR").click();
    await page.getByRole("option", { name: "2030" }).click();
    await expect(page.getByText("2030")).toBeVisible();

    const SingleDateType: ResTypes = "RECESS";

    await page.getByTestId(`CREATE_RESTRICTION`).click();
    await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

    await expect(
      page
        .getByTestId("TEMP_CONTAINER")
        .getByTestId("restriction-Date-Input-start"),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("TEMP_CONTAINER")
        .getByTestId("restriction-Date-Input-end"),
    ).toBeVisible();

    await expect(
      page.getByTestId("TEMP_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toBeVisible();

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input-start")
      .fill("2030-10-10");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input-end")
      .fill("2030-10-12");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test Range");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();

    // updates -------------
    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input-start")
      .fill("2030-12-10");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-Date-Input-end")
      .fill("2030-12-30");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("restriction-dsc-Input")
      .fill("Test Range UPDATED");

    await page
      .getByTestId("TEMP_CONTAINER")
      .getByTestId("btn-save-restriction")
      .click();
    // saved now check
    await expect(
      page.getByTestId("ADDED_CONTAINER").getByTestId("restriction-dsc-Input"),
    ).toHaveValue("Test Range UPDATED");
    await expect(
      page
        .getByTestId("ADDED_CONTAINER")
        .getByTestId("restriction-Date-Input-start"),
    ).toHaveValue("2030-12-10");
    await expect(
      page
        .getByTestId("ADDED_CONTAINER")
        .getByTestId("restriction-Date-Input-end"),
    ).toHaveValue("2030-12-30");
    await page
      .getByTestId("ADDED_CONTAINER")
      .getByTestId("btn-delete-restriction")
      .click();
  });
});
