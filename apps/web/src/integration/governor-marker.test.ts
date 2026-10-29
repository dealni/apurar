import { expect, it, vi } from "vitest";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import { createGovernorMainModel } from "./governor-main-model";

vi.mock(
  "../features/projetar/ui/formatacao-e-acessibilidade-1.js",
  async () => {
    const { h } = await import("preact");
    const { default: htm } = await import("htm");
    return { html: htm.bind(h), _t: (value: number) => String(value * 100) };
  },
);
vi.mock("../features/projetar/ui/mapa-dados-1.js", () => ({
  Fs: "#23252a",
  Pi: "#8a8f98",
}));
vi.mock("../features/projetar/geography.js", () => ({
  Geo: {
    ufs: { AC: { munis: [0, 1], muniLines: "municipal-boundaries" } },
    munis: [{ path: "neutral-town" }, { path: "candidate-town" }],
    lines: { uf: "state-boundaries", edge: "country-boundaries" },
  },
}));
vi.mock("../features/projetar/simulation.js", () => ({
  Sim: { UFS: ["AC", "AM"] },
}));
vi.mock("../features/projetar/ui/mapa-geometria-1.js", () => ({ Al: vi.fn() }));

// @ts-expect-error O componente visual legado é JavaScript sem declaração de tipos.
import * as officialMap from "../features/projetar/ui/official-map-presentation.js";
const { governorMarker, paintGovernorMap } = officialMap;

function marker(votes: number[], counted = 1) {
  const payload = supplementalFixture();
  payload.governors[0] = {
    ...payload.governors[0]!,
    status: "available",
    as_of: "2026-10-25T20:01:00Z",
    sections: { counted, total: 10 },
    candidates: votes.map((value, index) => ({
      id: String(index + 11),
      name: "Candidatura " + index,
      party: "TESTE",
      votes: value,
      status: "",
      validity: "válidos",
    })),
  };
  return governorMarker({
    modelo: { governor: createGovernorMainModel(payload, [], ["AC"]), ufs: {} },
    A: { uf: "AC", x: 1, y: 1 },
    linked: null,
    ft: 0,
    se: {},
    small: false,
  });
}

it("o marcador neutro não atribui liderança a uma candidatura empatada", () => {
  const result = marker([50, 50]);
  expect(result.props["aria-label"]).toBe("Acre, Resultado oficial");
  expect(result.props["aria-label"]).not.toContain("Candidatura");
  expect(result.props.children[1]).toBeNull();
  expect(result.props.style).toContain("--bg:#23252a;--fg:#8a8f98");
});

it("o marcador não apresenta liderança sem seções totalizadas", () => {
  const result = marker([80, 20], 0);
  expect(result.props["aria-label"]).not.toContain("Candidatura");
  expect(result.props.children[1]).toBeNull();
  expect(result.props.style).toContain("--bg:#23252a;--fg:#8a8f98");
});

it("o marcador apresenta a liderança quando há votos e seções oficiais", () => {
  const result = marker([80, 20]);
  expect(result.props["aria-label"]).toContain("Candidatura 0, 80%");
  expect(result.props.children[1]).not.toBeNull();
  expect(result.props.style).toContain("--bg:#297da8;--fg:#08090a");
});

it("mapa aplica a superfície presidencial aos recortes neutros sem alterar candidaturas", () => {
  const fills: string[] = [];
  const context = {
    fillStyle: "",
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(() => fills.push(context.fillStyle)),
  };
  const model = {
    states: { AC: { color: "#aeb8bd" }, AM: { color: "#297da8" } },
    municipalities: { 0: { color: "#aeb8bd" }, 1: { color: "#ce7843" } },
  };
  paintGovernorMap(context, { ox: 0, oy: 0, k: 1 }, model, "AC", null);
  expect(fills).toEqual(["#23252a", "#297da8", "#23252a", "#ce7843"]);
  expect(model.states.AC.color).toBe("#aeb8bd");
  expect(model.municipalities[0].color).toBe("#aeb8bd");
});
