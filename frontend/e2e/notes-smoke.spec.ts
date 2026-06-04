import { test, expect } from "@playwright/test";

const semverPattern = /v\d+\.\d+\.\d+/;
const adminPassword =
  process.env.INITIAL_ADMIN_PASSWORD ?? "change-me-local-only";

test("login shell shows product version in footer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("login-app")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
  const buildInfo = page.getByTestId("build-info");
  await expect(buildInfo).toBeVisible();
  await expect(buildInfo).toHaveText(semverPattern);
});

test("notes home shows product version after sign-in", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("notes-app")).toBeVisible();
  const buildInfo = page.getByTestId("build-info");
  await expect(buildInfo).toBeVisible();
  await expect(buildInfo).toHaveText(semverPattern);
});
