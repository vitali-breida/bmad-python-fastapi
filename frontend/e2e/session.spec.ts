import { test, expect } from "@playwright/test";
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER, setExpiredAccessToken, signIn } from "./helpers/auth";

test.describe("ADR-007 session resolution", () => {
  test("login success loads dashboard", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("slow login shows pending hint after 2 seconds", async ({ page }) => {
    await page.goto("/login");
    await page.route("**/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_500));
      await route.continue();
    });

    await page.getByLabel("Username").fill(E2E_ADMIN_USER);
    await page.getByLabel("Password").fill(E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    const pendingHint = page.getByTestId("login-pending-hint");
    await expect(pendingHint).not.toBeVisible({ timeout: 1_900 });
    await expect(pendingHint).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("login-pending-hint")).toContainText(
      "This may take a moment on first visit.",
    );
    await expect(page.getByTestId("dashboard-app")).toBeVisible({ timeout: 15_000 });
  });

  test("invalid credentials show error and stay on login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill(E2E_ADMIN_USER);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Incorrect username or password");
    await expect(page.getByTestId("dashboard-app")).not.toBeVisible();
  });

  test("refresh with valid token resolves session then shows dashboard", async ({
    page,
  }) => {
    await signIn(page);
    await page.reload();

    await expect(page.getByTestId("dashboard-app")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("login-app")).not.toBeVisible();
  });

  test("expired token shows session-expired notice on login", async ({ page }) => {
    await page.goto("/login");
    await setExpiredAccessToken(page);
    await page.goto("/dashboard");

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByTestId("session-expired-notice")).toContainText(
      "Your session expired",
    );
  });

  test("expired token on note save shows session-expired notice", async ({ page }) => {
    await signIn(page);
    await page.locator("header").getByRole("link", { name: "Notes", exact: true }).click();
    await expect(page.getByTestId("notes-app")).toBeVisible();
    await setExpiredAccessToken(page);

    const createPanel = page.getByTestId("create-panel");
    if (!(await createPanel.isVisible())) {
      await page.getByRole("button", { name: "+ New note" }).click();
    }
    await expect(createPanel).toBeVisible();
    await page.getByLabel("Title").fill(`Lunch save ${Date.now()}`);
    await page.getByRole("button", { name: "Create note" }).click();

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByTestId("session-expired-notice")).toContainText(
      "Your session expired",
    );
  });

  test("invalid token on refresh returns to login without error banner", async ({
    page,
  }) => {
    await page.goto("/login");
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
    await expect(page.getByTestId("dashboard-app")).toBeVisible();
  });

  test("logout clears session and returns to login", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByTestId("login-app")).toBeVisible();
    await expect(page.getByTestId("dashboard-app")).not.toBeVisible();

    await page.reload();
    await expect(page.getByTestId("login-app")).toBeVisible();
  });
});
