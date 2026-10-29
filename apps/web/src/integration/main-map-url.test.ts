import { describe, expect, it } from "vitest";
import { normalizeMainMapUrl } from "../navigation/panel-navigation";

describe("migração dos acessos antigos para o mapa principal", () => {
  it("remove a demonstração e o arquivo sem modificar a seleção", () => {
    const input = new URL(
      "https://apurar.app/apurar/?demo=1&painel=arquivo&utm_source=link#presidente-sp",
    );
    const output = normalizeMainMapUrl(input);
    expect(output.href).toBe(
      "https://apurar.app/apurar/?utm_source=link#presidente-sp",
    );
    expect(input.searchParams.get("demo")).toBe("1");
  });
  it("migra governadores preservando a UF e município", () => {
    expect(
      normalizeMainMapUrl(
        new URL(
          "https://apurar.app/apurar/?painel=governadores#presidente-ac-1200401~totalizado",
        ),
      ).hash,
    ).toBe("#governadores-ac-1200401");
    expect(
      normalizeMainMapUrl(
        new URL("https://apurar.app/apurar/?painel=governadores#presidente-zz"),
      ).hash,
    ).toBe("#governadores");
  });
  it("migra exterior e preserva a seleção de país existente", () => {
    expect(
      normalizeMainMapUrl(
        new URL("https://apurar.app/apurar/?painel=exterior#presidente-sp"),
      ).hash,
    ).toBe("#presidente-zz");
    expect(
      normalizeMainMapUrl(
        new URL("https://apurar.app/apurar/?painel=exterior#presidente-zz-pt"),
      ).hash,
    ).toBe("#presidente-zz-pt");
  });
});
