import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

const semverPattern = /v\d+\.\d+\.\d+/;

test("login shell shows product version in footer", async ({ page }) => {
  await page.goto("/");
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
