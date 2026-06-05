import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

const semverPattern = /v\d+\.\d+\.\d+/;

test("login shell shows product version in footer", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByTestId("login-app")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
  const buildInfo = page.getByTestId("build-info");
  await expect(buildInfo).toBeVisible();
  await expect(buildInfo).toHaveText(semverPattern);
});

test("notes home shows product version after sign-in", async ({ page }) => {
  await signIn(page);
  const buildInfo = page.getByTestId("build-info");
  await expect(buildInfo).toBeVisible();
  await expect(buildInfo).toHaveText(semverPattern);
});

test("dashboard hub shows tagline and new note flow", async ({ page }) => {
  await signIn(page);
  await expect(page.getByTestId("dashboard-app")).toBeVisible();
  await expect(page.getByText("Create and manage your notes")).toBeVisible();

  const newNoteButton = page.getByRole("button", {
    name: /^(New note|Create your first note)$/,
  });
  await expect(newNoteButton).toBeVisible();
  await newNoteButton.click();

  await expect(page.getByTestId("notes-app")).toBeVisible();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByTestId("create-panel")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("");
});

test("notes list create panel toggles and shows toast on detail", async ({ page }) => {
  await signIn(page);
  await page
    .locator("header")
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page.getByTestId("notes-app")).toBeVisible();

  const createPanel = page.getByTestId("create-panel");
  if (!(await createPanel.isVisible())) {
    await page.getByRole("button", { name: "+ New note" }).click();
  }
  await expect(createPanel).toBeVisible();

  const title = `Smoke note ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create note" }).click();

  await expect(page.getByTestId("note-detail-app")).toBeVisible();
  await expect(page.getByTestId("toast")).toContainText("Note created");
});

test("dashboard recent notes order matches notes list when notes exist", async ({
  page,
}) => {
  await signIn(page);
  await page
    .locator("header")
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page.getByTestId("notes-app")).toBeVisible();

  const listItems = page.getByRole("listitem");
  const listCount = await listItems.count();
  if (listCount === 0) {
    test.skip();
    return;
  }

  const firstListTitle = await listItems.first().getByRole("button").first().textContent();

  await page
    .locator("header")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  await expect(page.getByTestId("recent-notes")).toBeVisible();

  const firstRecentTitle = await page
    .getByTestId("recent-notes")
    .getByRole("listitem")
    .first()
    .getByRole("button")
    .first()
    .textContent();

  expect(firstRecentTitle?.trim()).toBe(firstListTitle?.trim());
});
