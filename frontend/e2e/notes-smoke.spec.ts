import { test, expect } from "@playwright/test";

test("notes app shell loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("notes-app")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Notes", level: 1 })).toBeVisible();
});
