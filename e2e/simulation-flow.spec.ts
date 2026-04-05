import { expect, test } from "./playwright-fixture";

test("dashboard load, market switch reset, and detailed trade errors", async ({ page }) => {
  const uid = Date.now();
  const email = `e2e_${uid}@example.com`;
  const password = "pass1234";

  await expect
    .poll(async () => {
      const response = await page.request.get("http://127.0.0.1:4000/api/health");
      return response.status();
    })
    .toBe(200);

  const registerResponse = await page.request.post("http://127.0.0.1:4000/api/auth/register", {
    data: { email, password, name: `e2e_${uid}` },
  });

  const authResponse = registerResponse.ok()
    ? registerResponse
    : await page.request.post("http://127.0.0.1:4000/api/auth/login", {
        data: { email, password },
      });

  expect(authResponse.ok()).toBeTruthy();
  const authPayload = await authResponse.json();
  const token = authPayload.token as string;
  expect(token).toBeTruthy();

  const createResponse = await page.request.post("http://127.0.0.1:4000/api/portfolio", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "E2E Portfolio",
      baseCurrency: "USD",
      holdings: [
        { symbol: "AAPL", quantity: 5, avgPrice: 180 },
      ],
    },
  });

  expect(createResponse.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Login" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Login" }).first().click();
  await expect(page).toHaveURL(/login/);
  await page.getByPlaceholder("trader@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.locator("form").getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/homepage|\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Your Portfolios" })).toBeVisible();
  await expect(page.getByText("E2E Portfolio", { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByText("E2E Portfolio", { exact: false })).toBeVisible();
  await expect(page.getByText("Could not load portfolios", { exact: false })).toHaveCount(0);

  await page.goto("/portfolio/create");
  await expect(page.getByRole("heading", { name: "Portfolio Builder" })).toBeVisible();
  await expect(page.locator('[role="combobox"]').first()).toContainText("AAPL");

  await page.getByRole("button", { name: "Crypto" }).click();
  await expect(page.locator('[role="combobox"]').first()).toContainText("Search assets globally");

  await page.goto("/simulation");
  await expect(page.getByRole("heading", { name: "TRADE", exact: true }).first()).toBeVisible();
  await page.locator('input[type="number"]').first().fill("99999999");
  await page.getByRole("button", { name: "BUY" }).click();
  await expect(page.getByText("Insufficient balance", { exact: false })).toBeVisible();
});
