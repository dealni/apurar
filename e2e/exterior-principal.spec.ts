import { openMapActions } from "./map-actions";
import { test, expect } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
});

async function openMobileSection(
  page: import("@playwright/test").Page,
  isMobile: boolean,
  name: string,
) {
  if (!isMobile) return;
  const button = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name, exact: true });
  if (!(await button.isVisible())) return;
  await button.click();
  await expect(button).toHaveAttribute("aria-current", "page");
}

test("exterior integra o mapa principal com navegação país e cidade", async ({
  page,
  isMobile,
}) => {
  const payload = supplementalFixture();
  payload.exterior.countries[0]!.coverage = { available: 1, total: 3 };
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
  await page.goto("/apurar/#presidente-zz-pt");
  const map = page.getByRole("region", { name: "Mapa principal do exterior" });
  await expect(map).toBeVisible();
  await expect(map.locator("canvas").first()).toBeVisible();
  await expect(map.locator("canvas.map:not([aria-hidden])")).toHaveCSS(
    "touch-action",
    isMobile ? "pan-y" : "none",
  );
  for (const layer of ["prev", "hov", "fx"]) {
    await expect(map.locator("canvas." + layer)).toHaveCSS(
      "pointer-events",
      "none",
    );
  }
  if (
    isMobile &&
    (await map.getByRole("navigation", { name: "Seções" }).isVisible())
  ) {
    await map.getByRole("button", { name: /Ver resultado oficial/ }).click();
    await expect(
      map
        .getByRole("navigation", { name: "Seções" })
        .getByRole("button", { name: "Resultados", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  await expect(map.getByText("Total parcial:", { exact: false })).toBeVisible();
  await expect(map.locator('[data-result-id="PT"]')).toBeVisible();
  await map.getByRole("button", { name: "Lisboa", exact: true }).click();
  await openMobileSection(page, isMobile, "Resultados");
  await expect(map.locator('[data-result-id="ZZ:29955"]')).toBeVisible();
  await expect(page).toHaveURL(/presidente-zz-29955/);
  await openMobileSection(page, isMobile, "Mapa");
  await openMapActions(page);
  await map.getByRole("button", { name: "Brasil", exact: true }).click();
  await expect(map).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: /Detalhamento oficial/ }),
  ).toHaveCount(0);
});
test("legenda exterior usa somente o suplemento quando a fonte nacional está indisponível", async ({
  page,
}) => {
  const payload = supplementalFixture();
  payload.exterior.cities[0]!.candidates.push({
    ...payload.exterior.cities[0]!.candidates[0]!,
    id: "22",
    name: "Outra candidatura oficial",
    votes: 20,
  });
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Fonte nacional indisponível" },
    }),
  );
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
  await page.goto("/apurar/#presidente-zz-pt");
  const legend = page.getByLabel("Legenda das candidaturas");
  await expect(legend).toContainText("Candidatura oficial de teste");
  await expect(legend).toContainText("Outra candidatura oficial");
  await expect(legend).not.toContainText("Candidatura A");
  await expect(legend).not.toContainText("Candidatura B");
});
