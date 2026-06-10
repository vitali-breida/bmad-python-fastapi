import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./helpers/auth";

function criticalViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations.filter((v) => v.impact === "critical");
}

test.describe("accessibility", () => {
  test("login page has no critical axe violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-app")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(criticalViolations(results.violations)).toHaveLength(0);
  });

  test("dashboard has no critical axe violations", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard");
    await expect(page.getByText("Loading notes…")).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(criticalViolations(results.violations)).toHaveLength(0);
  });

  test("notes list has no critical axe violations", async ({ page }) => {
    await signIn(page);
    await page.goto("/notes");
    await expect(page.getByText("Loading notes…")).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(criticalViolations(results.violations)).toHaveLength(0);
  });
});
