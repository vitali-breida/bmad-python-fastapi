import { test, expect } from "@playwright/test";

test("login shell loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("login-app")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
});
