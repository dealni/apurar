import { expect, type Page } from "@playwright/test";

/** Confere o horário do dado aplicado sem depender de uma faixa visual. */
export async function officialSourceTime(page: Page) {
  return page.evaluate(() => {
    const view = (
      window as unknown as {
        APURAR_CURRENT_VIEW?: () => { source?: { as_of?: string } };
      }
    ).APURAR_CURRENT_VIEW?.();
    return view?.source?.as_of ?? null;
  });
}

export async function waitForOfficialSource(page: Page) {
  await expect.poll(() => officialSourceTime(page)).toBeTruthy();
}

export async function expectOfficialTime(page: Page, text: string) {
  await expect
    .poll(async () => {
      const stamp = await officialSourceTime(page);
      return stamp
        ? new Date(stamp).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "";
    })
    .toContain(text);
}
