import { expect, test, type Page } from "@playwright/test";

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

const TEST_DESCRIPTIONS = [
  "Test Holiday",
  "Test Holiday UPDATED",
  "Test Range",
  "Test Range UPDATED",
  "Test DAYSWAP",
  "Test DAYSWAP UPDATED",
];

test.describe.configure({ mode: "serial" });

async function openCalendar2030(page: Page) {
  await page.goto("/calendar-management");

  await page.getByTestId("SELECT_NEW_YEAR").click();
  await page.getByRole("option", { name: "2030" }).click();

  await expect(page.getByText("2030")).toBeVisible();
}

function getAddedRestriction(page: Page, description: string) {
  return page.getByTestId("ADDED_CONTAINER").filter({
    has: page.locator(
      `input[data-testid="restriction-dsc-Input"][value="${description}"]`,
    ),
  });
}
async function cleanupTestRestrictions(page: Page) {
  for (const description of TEST_DESCRIPTIONS) {
    const restrictions = getAddedRestriction(page, description);

    while ((await restrictions.count()) > 0) {
      const countBeforeDelete = await restrictions.count();

      await restrictions.first().getByTestId("btn-delete-restriction").click();

      await expect(restrictions).toHaveCount(countBeforeDelete - 1);
    }
  }
}

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

  test.describe("Restrictions", () => {
    test.beforeEach(async ({ page }) => {
      await openCalendar2030(page);

      await cleanupTestRestrictions(page);
    });

    test.afterEach(async ({ page }) => {
      if (page.isClosed()) {
        return;
      }

      try {
        await openCalendar2030(page);
        await cleanupTestRestrictions(page);
      } catch {
        // Do not allow cleanup failures to hide
        // the original test failure.
      }
    });

    test("Calendar Page add Restriction SingleDate", async ({ page }) => {
      const SingleDateType: ResTypes = "PUBLIC_HOLIDAY";

      await page.getByTestId("CREATE_RESTRICTION").click();
      await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

      const temp = page.getByTestId("TEMP_CONTAINER");

      await expect(temp.getByTestId("restriction-Date-Input")).toBeVisible();

      await expect(temp.getByTestId("restriction-dsc-Input")).toBeVisible();

      await temp.getByTestId("restriction-Date-Input").fill("2030-12-30");

      await temp.getByTestId("restriction-dsc-Input").fill("Test Holiday");

      await temp.getByTestId("btn-save-restriction").click();

      const restriction = getAddedRestriction(page, "Test Holiday");

      await expect(restriction).toHaveCount(1);

      await expect(
        restriction.getByTestId("restriction-dsc-Input"),
      ).toHaveValue("Test Holiday");

      await expect(
        restriction.getByTestId("restriction-Date-Input"),
      ).toHaveValue("2030-12-30");
    });

    test("Calendar Page add Restriction Range", async ({ page }) => {
      const SingleDateType: ResTypes = "RECESS";

      await page.getByTestId("CREATE_RESTRICTION").click();
      await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

      const temp = page.getByTestId("TEMP_CONTAINER");

      await expect(
        temp.getByTestId("restriction-Date-Input-start"),
      ).toBeVisible();

      await expect(
        temp.getByTestId("restriction-Date-Input-end"),
      ).toBeVisible();

      await expect(temp.getByTestId("restriction-dsc-Input")).toBeVisible();

      await temp.getByTestId("restriction-Date-Input-start").fill("2030-10-10");

      await temp.getByTestId("restriction-Date-Input-end").fill("2030-10-12");

      await temp.getByTestId("restriction-dsc-Input").fill("Test Range");

      await temp.getByTestId("btn-save-restriction").click();

      const restriction = getAddedRestriction(page, "Test Range");

      await expect(restriction).toHaveCount(1);

      await expect(
        restriction.getByTestId("restriction-dsc-Input"),
      ).toHaveValue("Test Range");

      await expect(
        restriction.getByTestId("restriction-Date-Input-start"),
      ).toHaveValue("2030-10-10");

      await expect(
        restriction.getByTestId("restriction-Date-Input-end"),
      ).toHaveValue("2030-10-12");
    });

    test("Calendar Page add Restriction Day swap", async ({ page }) => {
      const SingleDateType: ResTypes = "DAY_SWAP";

      await page.getByTestId("CREATE_RESTRICTION").click();
      await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

      const temp = page.getByTestId("TEMP_CONTAINER");

      await expect(temp.getByTestId("restriction-Date-Input")).toBeVisible();

      await expect(temp.getByTestId("restriction-dsc-Input")).toBeVisible();

      await temp.getByTestId("SELECT_DAY").click();

      await page.getByRole("option", { name: "Wednesday" }).click();

      await temp.getByTestId("restriction-Date-Input").fill("2030-12-30");

      await temp.getByTestId("restriction-dsc-Input").fill("Test DAYSWAP");

      await temp.getByTestId("btn-save-restriction").click();

      const restriction = getAddedRestriction(page, "Test DAYSWAP");

      await expect(restriction).toHaveCount(1);

      await expect(
        restriction.getByTestId("restriction-dsc-Input"),
      ).toHaveValue("Test DAYSWAP");

      await expect(
        restriction.getByTestId("restriction-Date-Input"),
      ).toHaveValue("2030-12-30");

      await expect(restriction.getByTestId("SELECT_DAY")).toHaveText(
        "wednesday",
      );
    });

    test("Calendar Page update Restriction SingleDate", async ({ page }) => {
      const SingleDateType: ResTypes = "PUBLIC_HOLIDAY";

      await page.getByTestId("CREATE_RESTRICTION").click();
      await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

      const temp = page.getByTestId("TEMP_CONTAINER");

      await expect(temp.getByTestId("restriction-Date-Input")).toBeVisible();

      await expect(temp.getByTestId("restriction-dsc-Input")).toBeVisible();

      await temp.getByTestId("restriction-Date-Input").fill("2030-12-30");

      await temp.getByTestId("restriction-dsc-Input").fill("Test Holiday");

      await temp.getByTestId("btn-save-restriction").click();

      let restriction = getAddedRestriction(page, "Test Holiday");

      await expect(restriction).toHaveCount(1);

      await restriction
        .getByTestId("restriction-Date-Input")
        .fill("2030-10-31");

      await restriction
        .getByTestId("restriction-dsc-Input")
        .fill("Test Holiday UPDATED");

      await restriction.getByTestId("btn-save-restriction").click();

      restriction = getAddedRestriction(page, "Test Holiday UPDATED");

      await expect(restriction).toHaveCount(1);

      await expect(
        restriction.getByTestId("restriction-dsc-Input"),
      ).toHaveValue("Test Holiday UPDATED");

      await expect(
        restriction.getByTestId("restriction-Date-Input"),
      ).toHaveValue("2030-10-31");
    });

    test("Calendar Page update Restriction Day swap", async ({ page }) => {
      const SingleDateType: ResTypes = "DAY_SWAP";

      await page.getByTestId("CREATE_RESTRICTION").click();
      await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

      const temp = page.getByTestId("TEMP_CONTAINER");

      await expect(temp.getByTestId("restriction-Date-Input")).toBeVisible();

      await expect(temp.getByTestId("restriction-dsc-Input")).toBeVisible();

      await temp.getByTestId("SELECT_DAY").click();

      await page.getByRole("option", { name: "Wednesday" }).click();

      await temp.getByTestId("restriction-Date-Input").fill("2030-12-30");

      await temp.getByTestId("restriction-dsc-Input").fill("Test DAYSWAP");

      await temp.getByTestId("btn-save-restriction").click();

      let restriction = getAddedRestriction(page, "Test DAYSWAP");

      await expect(restriction).toHaveCount(1);

      await restriction
        .getByTestId("restriction-Date-Input")
        .fill("2030-10-30");

      await restriction
        .getByTestId("restriction-dsc-Input")
        .fill("Test DAYSWAP UPDATED");

      await restriction.getByTestId("SELECT_DAY").click();

      await page.getByRole("option", { name: "Thursday" }).click();

      await restriction.getByTestId("btn-save-restriction").click();

      restriction = getAddedRestriction(page, "Test DAYSWAP UPDATED");

      await expect(restriction).toHaveCount(1);

      await expect(
        restriction.getByTestId("restriction-dsc-Input"),
      ).toHaveValue("Test DAYSWAP UPDATED");

      await expect(
        restriction.getByTestId("restriction-Date-Input"),
      ).toHaveValue("2030-10-30");

      await expect(restriction.getByTestId("SELECT_DAY")).toHaveText(
        "thursday",
      );
    });

    test("Calendar Page update Restriction Range", async ({ page }) => {
      const SingleDateType: ResTypes = "RECESS";

      await page.getByTestId("CREATE_RESTRICTION").click();
      await page.getByTestId(`MENU_ITEM_${SingleDateType}`).click();

      const temp = page.getByTestId("TEMP_CONTAINER");

      await expect(
        temp.getByTestId("restriction-Date-Input-start"),
      ).toBeVisible();

      await expect(
        temp.getByTestId("restriction-Date-Input-end"),
      ).toBeVisible();

      await expect(temp.getByTestId("restriction-dsc-Input")).toBeVisible();

      await temp.getByTestId("restriction-Date-Input-start").fill("2030-10-10");

      await temp.getByTestId("restriction-Date-Input-end").fill("2030-10-12");

      await temp.getByTestId("restriction-dsc-Input").fill("Test Range");

      await temp.getByTestId("btn-save-restriction").click();

      let restriction = getAddedRestriction(page, "Test Range");

      await expect(restriction).toHaveCount(1);

      await restriction
        .getByTestId("restriction-Date-Input-start")
        .fill("2030-12-10");

      await restriction
        .getByTestId("restriction-Date-Input-end")
        .fill("2030-12-30");

      await restriction
        .getByTestId("restriction-dsc-Input")
        .fill("Test Range UPDATED");

      await restriction.getByTestId("btn-save-restriction").click();

      restriction = getAddedRestriction(page, "Test Range UPDATED");

      await expect(restriction).toHaveCount(1);

      await expect(
        restriction.getByTestId("restriction-dsc-Input"),
      ).toHaveValue("Test Range UPDATED");

      await expect(
        restriction.getByTestId("restriction-Date-Input-start"),
      ).toHaveValue("2030-12-10");

      await expect(
        restriction.getByTestId("restriction-Date-Input-end"),
      ).toHaveValue("2030-12-30");
    });
  });
});
