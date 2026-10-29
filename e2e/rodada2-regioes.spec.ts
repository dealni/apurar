import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

test("regiões e exterior não anunciam zero seções quando a API está indisponível", async ({
  page,
}) => {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503 }));
  await page.goto("/apurar/");
  const regions = page.locator(".regc");
  await expect(
    regions.getByRole("button", { name: "Exterior: Dados indisponíveis" }),
  ).toBeVisible();
  await expect(regions).not.toContainText("Nenhuma seção totalizada");
  await regions.getByRole("button", { name: /^Norte / }).click();
  await expect(page.locator(".rdet")).toContainText(
    "Dados regionais indisponíveis nesta atualização.",
  );
  await expect(page.locator(".rdet")).not.toContainText(
    "Nenhuma seção totalizada",
  );
});

test("região preserva percentuais das candidaturas quando faltam totais oficiais", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: "browser-live-fixture",
        items: [
          {
            available: true,
            scope: "municipality",
            unit_id: "AC:01120",
            uf: "AC",
            name: "Acrelândia",
            sections: { counted: 10, total: 20 },
            as_of: "2026-10-25T21:00:00Z",
            candidates: [
              { id: "01", votes: 2000 },
              { id: "02", votes: 1600 },
            ],
          },
        ],
      },
    }),
  );
  await page.goto("/apurar/");
  const regions = page.locator(".regc");
  await expect(regions.getByRole("button", { name: /^Norte / })).toContainText(
    "Cobertura municipal incompleta",
  );
  await regions.getByRole("button", { name: /^Norte / }).click();
  const leader = page.locator(".rdet .crow").first();
  await expect(leader).toHaveAttribute("aria-label", /55,56%/);
  await expect(leader).toHaveAttribute("aria-label", /2\.000 votos/);
  await expect(page.locator(".rdet")).toContainText(
    "Cobertura municipal incompleta",
  );
});

test("exterior com seções conhecidas e zero contado continua distinto de dados ausentes", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: "browser-live-fixture",
        items: [
          {
            available: true,
            scope: "exterior",
            unit_id: "ZZ:teste",
            uf: "ZZ",
            name: "Exterior",
            sections: { counted: 0, total: 100 },
            as_of: "2026-10-25T21:00:00Z",
            candidates: [
              { id: "01", votes: 0 },
              { id: "02", votes: 0 },
            ],
          },
        ],
      },
    }),
  );
  await page.goto("/apurar/");
  const abroad = page.locator(".regc .reg.zz");
  await expect(abroad).toHaveAttribute(
    "aria-label",
    "Exterior: Nenhuma seção totalizada",
  );
  await expect(abroad).toContainText("Nenhuma seção totalizada");
  await expect(abroad).not.toContainText("Dados indisponíveis");
});
