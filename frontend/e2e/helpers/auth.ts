import { expect, type Page } from "@playwright/test";

export const E2E_ADMIN_USER = "admin";
export const E2E_ADMIN_PASSWORD =
  process.env.INITIAL_ADMIN_PASSWORD ?? "change-me-local-only";

/** Sign in and wait until the dashboard is ready (GET /auth/me succeeded). */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Username").fill(E2E_ADMIN_USER);
  await page.getByLabel("Password").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("dashboard-app")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
}
