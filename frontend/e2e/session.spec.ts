import { test, expect } from "@playwright/test";
import { E2E_ADMIN_USER, signIn } from "./helpers/auth";

test.describe("ADR-007 session resolution", () => {
  test("login success loads notes app", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Notes", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("invalid credentials show error and stay on login", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Username").fill(E2E_ADMIN_USER);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Incorrect username or password");
    await expect(page.getByTestId("notes-app")).not.toBeVisible();
  });

  test("refresh with valid token resolves session then shows notes app", async ({
    page,
  }) => {
    await signIn(page);
    await page.reload();

    await expect(page.getByTestId("notes-app")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("login-app")).not.toBeVisible();
  });

  test("invalid token on refresh returns to login without error banner", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.setItem("access_token", "not-a-valid-jwt");
    });
    await page.reload();

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByRole("alert")).not.toBeVisible();
  });

  test("session check failure shows retry and recovers when API is back", async ({
    page,
  }) => {
    await signIn(page);

    let blockMe = true;
    await page.route("**/auth/me", async (route) => {
      if (blockMe) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Service unavailable" }),
        });
        return;
      }
      await route.continue();
    });

    await page.reload();
    await expect(page.getByTestId("session-error")).toBeVisible();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

    blockMe = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByTestId("notes-app")).toBeVisible();
  });

  test("logout clears session and returns to login", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByTestId("notes-app")).not.toBeVisible();

    await page.reload();
    await expect(page.getByTestId("login-app")).toBeVisible();
  });
});
