import { expect, type Page } from "@playwright/test";

/** Waits until NotesListPage finishes loading (skeleton / aria-busy cleared). */
export async function waitForNotesListLoaded(page: Page): Promise<void> {
  await expect(page.getByTestId("notes-app")).toBeVisible();
  await expect(page.getByLabel("Loading notes")).toHaveCount(0);
}
