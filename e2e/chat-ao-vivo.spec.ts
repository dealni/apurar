import { expect, test, type Page, type WebSocketRoute } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";
import { mountArchivedChat } from "./chat-fixture";

const message = (id: string, name: string, text: string) => ({
  id,
  name,
  text,
  createdAt: "2026-10-25T12:00:00Z",
});

async function mockChat(page: Page) {
  const connections: WebSocketRoute[] = [];
  const received: {
    type: string;
    name?: string;
    text?: string;
    requestId?: string;
  }[] = [];
  await page.routeWebSocket("**/api/chat/socket", (socket) => {
    connections.push(socket);
    socket.send(
      JSON.stringify({
        type: "history",
        messages: [message("old", "Visitante", "<img src=x onerror=alert(1)>")],
      }),
    );
    socket.send(JSON.stringify({ type: "presence", count: 2 }));
    socket.onMessage((raw) => {
      const event = JSON.parse(String(raw));
      received.push(event);
      if (event.type === "message") {
        socket.send(
          JSON.stringify({
            type: "message",
            message: message(String(received.length), "Diogo", event.text),
          }),
        );
        socket.send(
          JSON.stringify({ type: "ack", requestId: event.requestId }),
        );
      }
    });
  });
  return { connections, received };
}

for (const path of ["/", "/apurar/", "/1turno/"]) {
  test(`chat público envia texto puro e restaura foco em ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    const chat = await mockChat(page);
    await page.goto(path);
    await mountArchivedChat(page);
    const launcher = page.getByRole("button", {
      name: "Chat ao vivo",
      exact: true,
    });
    await expect(launcher).toBeVisible();
    expect(chat.connections).toHaveLength(0);
    await launcher.click();
    const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("status")).toHaveText("Conectado");
    await expect(panel.getByRole("log")).toContainText(
      "<img src=x onerror=alert(1)>",
    );
    await expect(panel.getByRole("log").locator("img")).toHaveCount(0);
    await panel.getByLabel("Seu apelido").fill("D");
    await panel.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(panel.getByRole("alert")).toContainText("2 a 24");
    await panel.getByLabel("Seu apelido").fill("Diogo");
    await panel.getByRole("button", { name: "Entrar", exact: true }).click();
    await panel.getByLabel("Mensagem", { exact: true }).fill("Boa apuração!");
    await panel.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(panel.getByRole("log")).toContainText("Boa apuração!");
    await expect(panel.getByLabel("Mensagem", { exact: true })).toHaveValue("");
    expect(chat.received).toEqual([
      { type: "join", name: "Diogo" },
      { type: "message", text: "Boa apuração!", requestId: expect.any(String) },
    ]);
    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(launcher).toBeFocused();
    await expect(launcher).toHaveAttribute("aria-expanded", "false");
  });
}

test("chat reconecta, preserva rascunho em erro e não transborda em 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await mockLivePanel(page);
  let active: WebSocketRoute | undefined;
  let connections = 0;
  const joins: string[] = [];
  await page.routeWebSocket("**/api/chat/socket", (socket) => {
    active = socket;
    connections++;
    socket.send(JSON.stringify({ type: "presence", count: 1 }));
    socket.onMessage((raw) => {
      const event = JSON.parse(String(raw));
      if (event.type === "join") joins.push(event.name);
      if (event.type === "message")
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Aguarde antes de enviar novamente.",
            requestId: event.requestId,
          }),
        );
    });
  });
  await page.goto("/");
  await mountArchivedChat(page);
  await page.getByRole("button", { name: "Chat ao vivo", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
  await panel.getByLabel("Seu apelido").fill("Diogo");
  await panel.getByRole("button", { name: "Entrar", exact: true }).click();
  await panel
    .getByLabel("Mensagem", { exact: true })
    .fill("Não perder o rascunho");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("Aguarde");
  await expect(panel.getByLabel("Mensagem", { exact: true })).toHaveValue(
    "Não perder o rascunho",
  );
  await active!.close({ code: 1012, reason: "reinício" });
  await expect(panel.getByRole("status")).toContainText("tentando reconectar");
  await expect.poll(() => connections).toBe(2);
  await expect.poll(() => joins).toEqual(["Diogo", "Diogo"]);
  const bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(320);
  await panel.getByRole("button", { name: "Fechar chat" }).click();
  await expect(panel).not.toBeVisible();
});

test("chat permite enviar com pouca altura disponível", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 320 });
  await mockLivePanel(page);
  await mockChat(page);
  await page.goto("/");
  await mountArchivedChat(page);
  await page.getByRole("button", { name: "Chat ao vivo", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
  await panel.getByLabel("Seu apelido").fill("Diogo");
  await panel.getByRole("button", { name: "Entrar", exact: true }).click();
  await panel
    .getByLabel("Mensagem", { exact: true })
    .fill("Cabe no celular deitado");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(panel.getByLabel("Mensagem", { exact: true })).toHaveValue("");
  await panel.getByRole("button", { name: "Fechar chat" }).click();
  await expect(panel).not.toBeVisible();
});

for (const selectedCard of ["gov-selected", "exterior-selected"]) {
  test(`chat mantém altura útil com teclado e cartão ${selectedCard}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockLivePanel(page);
    await mockChat(page);
    await page.goto("/");
    await mountArchivedChat(page);
    // Fixture estrutural aciona os mesmos seletores sem modificar dados eleitorais.
    await page.evaluate((cardClass) => {
      const fixture = document.createElement("div");
      fixture.hidden = true;
      fixture.style.display = "none";
      fixture.className = "hud phone shell";
      const navigation = document.createElement("nav");
      navigation.className = "tabbar";
      const card = document.createElement("div");
      card.className = cardClass;
      fixture.append(navigation, card);
      document.querySelector("#app")!.append(fixture);
    }, selectedCard);
    await page
      .getByRole("button", { name: "Chat ao vivo", exact: true })
      .click();
    const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
    await panel.getByLabel("Seu apelido").fill("Diogo");
    await panel.getByRole("button", { name: "Entrar", exact: true }).click();
    // A redução reproduz a altura disponível com teclado virtual aberto.
    await page.setViewportSize({ width: 390, height: 260 });
    const bounds = await panel.boundingBox();
    expect(bounds!.height).toBeGreaterThan(200);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(260);
    await panel
      .getByLabel("Mensagem", { exact: true })
      .fill("Mensagem com teclado aberto");
    await panel.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(panel.getByLabel("Mensagem", { exact: true })).toHaveValue("");
    await panel.getByRole("button", { name: "Fechar chat" }).click();
    await expect(panel).not.toBeVisible();
  });
}

test("chat só limpa envio pelo ack correspondente e conserva rascunho sem confirmação", async ({
  page,
}) => {
  await mockLivePanel(page);
  let active: WebSocketRoute | undefined;
  const requests: string[] = [];
  await page.routeWebSocket("**/api/chat/socket", (socket) => {
    active = socket;
    socket.onMessage((raw) => {
      const event = JSON.parse(String(raw));
      if (event.type === "message") requests.push(event.requestId);
    });
  });
  await page.goto("/");
  await mountArchivedChat(page);
  await page.getByRole("button", { name: "Chat ao vivo", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
  await expect(panel.getByRole("status")).toContainText("Conectado");
  await panel.getByLabel("Seu apelido").fill("Diogo");
  await panel.getByRole("button", { name: "Entrar", exact: true }).click();
  const composer = panel.getByLabel("Mensagem", { exact: true });
  await composer.fill("Texto igual");
  await page.clock.install();
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  active!.send(
    JSON.stringify({
      type: "message",
      message: message("other", "Diogo", "Texto igual"),
    }),
  );
  active!.send(JSON.stringify({ type: "ack", requestId: "outro-envio" }));
  await expect(panel.getByRole("log")).toContainText("Texto igual");
  await expect(composer).toHaveValue("Texto igual");
  await expect(composer).toHaveAttribute("readonly", "");
  active!.send(JSON.stringify({ type: "ack", requestId: requests[0] }));
  await expect(composer).toHaveValue("");

  // Servidor antigo transmite a mensagem, mas não conhece o ack privado.
  await composer.fill("Rascunho preservado");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  active!.send(
    JSON.stringify({
      type: "message",
      message: message("legacy", "Diogo", "Rascunho preservado"),
    }),
  );
  await page.clock.fastForward(10_001);
  await expect(panel.getByRole("alert")).toContainText(
    "envio não foi confirmado",
  );
  await expect(composer).toHaveValue("Rascunho preservado");
  await expect(composer).not.toHaveAttribute("readonly", "");
  await expect(
    panel.getByRole("button", { name: "Enviar", exact: true }),
  ).toBeEnabled();
  expect(requests).toHaveLength(2);
  // Uma confirmação atrasada não pode apagar texto editado depois do prazo.
  await composer.fill("Novo rascunho");
  active!.send(JSON.stringify({ type: "ack", requestId: requests[1] }));
  await expect(composer).toHaveValue("Novo rascunho");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect.poll(() => requests.length).toBe(3);
  active!.send(
    JSON.stringify({
      type: "error",
      requestId: requests[1],
      message: "Erro atrasado",
    }),
  );
  await expect(panel.getByRole("alert")).toHaveText("Erro atrasado");
  await expect(composer).toHaveAttribute("readonly", "");
  active!.send(
    JSON.stringify({ type: "error", message: "Erro legado sem correlação" }),
  );
  await expect(panel.getByRole("alert")).toHaveText(
    "Erro legado sem correlação",
  );
  await expect(composer).toHaveAttribute("readonly", "");
  active!.send(JSON.stringify({ type: "ack", requestId: requests[2] }));
  await expect(composer).toHaveValue("");
  await expect(panel.getByRole("alert")).not.toBeVisible();
});

test("chat limita conexão pendente, ignora socket antigo e cancela timers ao fechar", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.addInitScript(() => {
    const sockets: EventTarget[] = [];
    class PendingSocket extends EventTarget {
      constructor() {
        super();
        sockets.push(this);
      }
      send() {}
      close() {
        this.dispatchEvent(new Event("close"));
      }
    }
    Object.assign(window, {
      WebSocket: PendingSocket,
      chatTestSockets: sockets,
    });
  });
  await page.clock.install();
  await page.goto("/");
  await mountArchivedChat(page);
  const launcher = page.getByRole("button", {
    name: "Chat ao vivo",
    exact: true,
  });
  await launcher.click();
  const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
  await expect(panel.getByRole("status")).toHaveText("Conectando…");
  await page.clock.fastForward(10_001);
  await expect(panel.getByRole("status")).toContainText("tentando reconectar");
  await page.clock.fastForward(1001);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { chatTestSockets: EventTarget[] })
          .chatTestSockets.length,
    ),
  ).toBe(2);
  await page.evaluate(() => {
    const sockets = (window as unknown as { chatTestSockets: EventTarget[] })
      .chatTestSockets;
    sockets[0]!.dispatchEvent(new Event("open"));
  });
  await expect(panel.getByRole("status")).toHaveText("Conectando…");
  await page.evaluate(() => {
    const sockets = (window as unknown as { chatTestSockets: EventTarget[] })
      .chatTestSockets;
    sockets[1]!.dispatchEvent(new Event("open"));
  });
  await expect(panel.getByRole("status")).toContainText("Conectado");
  await page.clock.fastForward(10_001);
  await expect(panel.getByRole("status")).toContainText("Conectado");
  await panel.getByRole("button", { name: "Fechar chat" }).click();
  await launcher.click();
  await panel.getByRole("button", { name: "Fechar chat" }).click();
  await page.clock.fastForward(60_000);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { chatTestSockets: EventTarget[] })
          .chatTestSockets.length,
    ),
  ).toBe(3);
});

test("chat preserva rascunho e cancela envio na restauração da página", async ({
  page,
}) => {
  await mockLivePanel(page);
  let connections = 0;
  await page.routeWebSocket("**/api/chat/socket", () => {
    connections++;
  });
  await page.goto("/");
  await mountArchivedChat(page);
  await page.getByRole("button", { name: "Chat ao vivo", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Chat ao vivo" });
  await expect(panel.getByRole("status")).toContainText("Conectado");
  await panel.getByLabel("Seu apelido").fill("Diogo");
  await panel.getByRole("button", { name: "Entrar", exact: true }).click();
  const composer = panel.getByLabel("Mensagem", { exact: true });
  await composer.fill("Texto antes de sair");
  await page.clock.install();
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(composer).toHaveAttribute("readonly", "");
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await expect(composer).not.toHaveAttribute("readonly", "");
  await page.clock.fastForward(30_000);
  expect(connections).toBe(1);
  await expect(composer).toHaveValue("Texto antes de sair");
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await expect.poll(() => connections).toBe(2);
  await expect(panel.getByRole("status")).toContainText("Conectado");
  await expect(composer).toHaveValue("Texto antes de sair");
  await expect(panel.getByRole("alert")).not.toBeVisible();
});
