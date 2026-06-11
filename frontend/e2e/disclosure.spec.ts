import { test, expect, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { waitForNotesListLoaded } from "./helpers/notes";

async function openFirstNoteDetail(page: Page) {
  await page
    .locator("header")
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await waitForNotesListLoaded(page);

  const notesList = page.getByRole("region", { name: "Notes list" });
  const noteCount = await notesList.getByRole("listitem").count();
  if (noteCount === 0) {
    const title = `Disclosure note ${Date.now()}`;
    const createPanel = page.getByTestId("create-panel");
    if (!(await createPanel.isVisible())) {
      await page.getByRole("button", { name: "+ New note" }).click();
    }
    await page.getByLabel("Title").fill(title);
    await page.getByRole("button", { name: "Create note" }).click();
    await expect(page.getByTestId("note-detail-app")).toBeVisible();
    return;
  }

  await notesList.getByRole("listitem").first().getByRole("button").first().click();
  await expect(page.getByTestId("note-detail-app")).toBeVisible();
}

test.describe("ADR-013 disclosure — detail panel", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await openFirstNoteDetail(page);
  });

  test("side panel toggles metadata and delete while editor stays visible", async ({
    page,
  }) => {
    const toggle = page.getByTestId("note-detail-panel-toggle");
    const panel = page.getByTestId("note-detail-panel");
    const editor = page.getByRole("region", { name: "Note editor" });

    await expect(editor).toBeVisible();
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(panel).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toContainText(/Last updated|Not updated yet/i);
    await expect(panel.getByRole("button", { name: "Delete note" })).toBeVisible();
    await expect(editor).toBeVisible();
    await expect(page.getByLabel("Title")).toBeVisible();

    await toggle.click();
    await expect(panel).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("side panel closes on Escape", async ({ page }) => {
    const toggle = page.getByTestId("note-detail-panel-toggle");
    const panel = page.getByTestId("note-detail-panel");

    await toggle.click();
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape does not close side panel while delete dialog is open", async ({
    page,
  }) => {
    const toggle = page.getByTestId("note-detail-panel-toggle");
    const panel = page.getByTestId("note-detail-panel");

    await toggle.click();
    await panel.getByRole("button", { name: "Delete note" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(panel).toBeVisible();
  });
});

test.describe("ADR-013 disclosure — notes list", () => {
  test("opens create panel on ?new=1 deep link", async ({ page }) => {
    await signIn(page);
    await page
      .getByRole("button", { name: /New note|Create your first note/ })
      .click();
    await expect(page).toHaveURL(/\/notes(\?new=1)?$/);
    await waitForNotesListLoaded(page);
    await expect(page.getByTestId("create-panel")).toBeVisible();
  });
});
