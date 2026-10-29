import { expect, test, type Page } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";
import { mountArchivedChat } from "./chat-fixture";

async function openChat(page: Page, path = "/") {
  await mockLivePanel(page);
  const sent: { type: string; text?: string; requestId?: string }[] = [];
  await page.routeWebSocket("**/api/chat/socket", (socket) => {
    socket.send(
      JSON.stringify({
        type: "history",
        messages: [
          {
            id: "history",
            name: "Visitante",
            text: "Olá :KEKW: <img src=x onerror=alert(1)> :desconhecido:",
            createdAt: "2026-10-25T12:00:00Z",
          },
        ],
      }),
    );
    socket.onMessage((raw) => {
      const event = JSON.parse(String(raw));
      sent.push(event);
      if (event.type !== "message") return;
      socket.send(
        JSON.stringify({
          type: "message",
          message: {
            id: "new",
            name: "Teste",
            text: event.text,
            createdAt: "2026-10-25T12:01:00Z",
          },
        }),
      );
      socket.send(JSON.stringify({ type: "ack", requestId: event.requestId }));
    });
  });
  await page.goto(path);
  await mountArchivedChat(page);
  await page.getByRole("button", { name: "Chat ao vivo", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
  await panel.getByLabel("Seu apelido").fill("Teste");
  await panel.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(panel.getByRole("status")).toHaveText("Conectado");
  return { panel, sent };
}

for (const path of ["/", "/1turno/"]) {
  test(`20 memes locais no seletor, histórico e envio em ${path}`, async ({
    page,
  }) => {
    const { panel, sent } = await openChat(page, path);
    const log = panel.getByRole("log");
    await expect(log.locator("img")).toHaveCount(1);
    await expect(log.getByAltText(":KEKW:")).toBeVisible();
    await expect(log).toContainText(
      "<img src=x onerror=alert(1)> :desconhecido:",
    );
    const text = panel.getByLabel("Mensagem", { exact: true });
    await text.fill("Boa apuração! ");
    await panel.getByRole("button", { name: "Emotes", exact: true }).click();
    const picker = panel.getByRole("group", { name: "Escolher emote" });
    await expect(picker.getByRole("button")).toHaveCount(20);
    const tokens: string[] = [];
    for (const button of await picker.getByRole("button").all()) {
      const img = button.locator("img");
      await button.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate(
            (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const source = (await img.getAttribute("src"))!;
      expect(
        source.startsWith("data:image/webp;base64,") ||
          new URL(source, page.url()).origin === new URL(page.url()).origin,
      ).toBe(true);
      tokens.push(
        `:${(await button.getAttribute("aria-label"))!.split(" · ")[0]}:`,
      );
    }
    await picker
      .getByRole("button", { name: "KEKW · Rindo muito", exact: true })
      .click();
    await expect(text).toHaveValue("Boa apuração! :KEKW:");
    await expect(text).toBeFocused();
    expect(sent.filter((item) => item.type === "message")).toHaveLength(0);
    await text.fill(tokens.join(" "));
    await panel.getByRole("button", { name: "Enviar", exact: true }).click();
    const last = log.locator("article").last();
    await expect(last.locator("img")).toHaveCount(20);
    await expect(text).toHaveValue("");
    expect(sent.find((item) => item.type === "message")?.text).toBe(
      tokens.join(" "),
    );
    await panel.getByRole("button", { name: "Emotes", exact: true }).click();
    await page.screenshot({ path: test.info().outputPath("chat-memes.png") });
  });
}

test("seletor respeita seleção, limite e Escape sem fechar o chat", async ({
  page,
}) => {
  const { panel, sent } = await openChat(page);
  const text = panel.getByLabel("Mensagem", { exact: true });
  const toggle = panel.getByRole("button", {
    name: "Emotes",
    exact: true,
  });
  await text.fill("antes substituir depois");
  await text.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(6, 16),
  );
  await toggle.click();
  await panel
    .getByRole("button", { name: "Sadge · Triste", exact: true })
    .click();
  await expect(text).toHaveValue("antes :Sadge: depois");
  await text.fill("x".repeat(278));
  await toggle.click();
  await panel
    .getByRole("button", { name: "KEKW · Rindo muito", exact: true })
    .click();
  await expect(text).toHaveValue("x".repeat(278));
  await expect(panel.getByRole("alert")).toContainText("Não há espaço");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(panel).toBeVisible();
  expect(sent.filter((item) => item.type === "message")).toHaveLength(0);
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
});
