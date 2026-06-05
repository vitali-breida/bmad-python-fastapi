import { test, expect, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";

function uniqueTitle(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

function noteListItem(page: Page, title: string) {
  return page.getByRole("listitem").filter({ hasText: title });
}

function noteSelectButton(page: Page, title: string) {
  return noteListItem(page, title).getByRole("button").first();
}

async function goToNotes(page: Page): Promise<void> {
  await page
    .locator("header")
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page.getByTestId("notes-app")).toBeVisible();
}

async function openCreatePanel(page: Page): Promise<void> {
  const panel = page.getByTestId("create-panel");
  if (!(await panel.isVisible())) {
    await page.getByRole("button", { name: "+ New note" }).click();
  }
  await expect(panel).toBeVisible();
}

async function openNoteActionsMenu(page: Page, title: string): Promise<void> {
  const item = noteListItem(page, title);
  await item.getByRole("button", { name: `Actions for note ${title}` }).click();
}

test.describe("ADR-007 notes CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await goToNotes(page);
  });

  test("create, read, update, and delete a note", async ({ page }) => {
    const title = uniqueTitle("E2E note");
    const updatedTitle = uniqueTitle("E2E note updated");

    await openCreatePanel(page);
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Body").fill("First body");
    await page.getByRole("button", { name: "Create note" }).click();

    await expect(page.getByTestId("note-detail-app")).toBeVisible();
    await expect(page).toHaveURL(/\/notes\/\d+$/);
    await expect(page.getByTestId("toast")).toContainText("Note created");
    await expect(page.getByRole("heading", { name: "Edit note", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue(title);
    await expect(page.getByLabel("Body")).toHaveValue("First body");

    await page.getByLabel("Title").fill(updatedTitle);
    await page.getByLabel("Body").fill("Updated body");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByTestId("toast")).toContainText("Saved");
    await expect(page.getByLabel("Title")).toHaveValue(updatedTitle);
    await expect(page.getByLabel("Body")).toHaveValue("Updated body");
    await expect(page.getByRole("region", { name: "Note editor" })).toContainText(
      /Last updated/i,
    );

    await page.getByRole("button", { name: "Delete note" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

    await expect(page.getByTestId("notes-app")).toBeVisible();
    await expect(noteSelectButton(page, updatedTitle)).not.toBeVisible();
  });

  test("cancel button clears the create form and collapses panel", async ({ page }) => {
    await openCreatePanel(page);
    const title = uniqueTitle("Draft note");

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Body").fill("Draft body");
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByTestId("create-panel")).not.toBeVisible();
    await expect(noteSelectButton(page, title)).not.toBeVisible();
  });

  test("title is required before save", async ({ page }) => {
    await openCreatePanel(page);
    await page.getByLabel("Body").fill("Body without title");
    await page.getByRole("button", { name: "Create note" }).click();

    await expect(page.getByText("Title is required")).toBeVisible();
  });

  test("delete dialog can be cancelled", async ({ page }) => {
    const title = uniqueTitle("Keep note");

    await openCreatePanel(page);
    await page.getByLabel("Title").fill(title);
    await page.getByRole("button", { name: "Create note" }).click();
    await expect(page.getByTestId("note-detail-app")).toBeVisible();

    await goToNotes(page);
    await expect(noteSelectButton(page, title)).toBeVisible();

    await openNoteActionsMenu(page, title);
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(noteSelectButton(page, title)).toBeVisible();
  });
});
