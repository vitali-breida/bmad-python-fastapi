import { expect, type Page } from "@playwright/test";

export const E2E_ADMIN_USER = "admin";
export const E2E_ADMIN_PASSWORD =
  process.env.INITIAL_ADMIN_PASSWORD ?? "change-me-local-only";

/** Replace session token with a JWT whose `exp` is two minutes in the past. */
export async function setExpiredAccessToken(page: Page): Promise<void> {
  await page.evaluate(() => {
    const toBase64Url = (value: string) =>
      btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = toBase64Url(
      JSON.stringify({ sub: "1", exp: Math.floor(Date.now() / 1000) - 120 }),
    );
    sessionStorage.setItem("access_token", `${header}.${payload}.invalid-signature`);
  });
}

/** Sign in and wait until the dashboard is ready (GET /auth/me succeeded). */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Username").fill(E2E_ADMIN_USER);
  await page.getByLabel("Password").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("dashboard-app")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
}
