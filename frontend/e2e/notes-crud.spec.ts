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

test.describe("ADR-007 notes CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("create, read, update, and delete a note", async ({ page }) => {
    const title = uniqueTitle("E2E note");
    const updatedTitle = uniqueTitle("E2E note updated");

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Body").fill("First body");
    await page.getByRole("button", { name: "Create note" }).click();

    const noteRow = noteSelectButton(page, title);
    await expect(noteRow).toBeVisible();
    await expect(page.getByRole("heading", { name: "Edit note", level: 2 })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue(title);

    await noteRow.click();
    await expect(page.getByLabel("Title")).toHaveValue(title);
    await expect(page.getByLabel("Body")).toHaveValue("First body");

    await page.getByLabel("Title").fill(updatedTitle);
    await page.getByLabel("Body").fill("Updated body");
    await page.getByRole("button", { name: "Save changes" }).click();

    const updatedRow = noteSelectButton(page, updatedTitle);
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText("Updated body");
    await expect(page.getByRole("region", { name: "Note editor" })).toContainText(
      /Last updated/i,
    );

    await page.getByRole("button", { name: `Delete note ${updatedTitle}` }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

    await expect(noteSelectButton(page, updatedTitle)).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "New note", level: 2 })).toBeVisible();
  });

  test("new note button clears the editor", async ({ page }) => {
    const title = uniqueTitle("Draft note");

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Body").fill("Draft body");
    await page.getByRole("button", { name: "New note" }).click();

    await expect(page.getByRole("heading", { name: "New note", level: 2 })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue("");
    await expect(page.getByLabel("Body")).toHaveValue("");
  });

  test("title is required before save", async ({ page }) => {
    await page.getByLabel("Body").fill("Body without title");
    await page.getByRole("button", { name: "Create note" }).click();

    await expect(page.getByText("Title is required")).toBeVisible();
  });

  test("delete dialog can be cancelled", async ({ page }) => {
    const title = uniqueTitle("Keep note");

    await page.getByLabel("Title").fill(title);
    await page.getByRole("button", { name: "Create note" }).click();
    await expect(noteSelectButton(page, title)).toBeVisible();

    await page.getByRole("button", { name: `Delete note ${title}` }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(noteSelectButton(page, title)).toBeVisible();
  });
});
