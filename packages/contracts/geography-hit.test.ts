import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  Geo: {
    ufs: {} as Record<string, { box: number[]; munis: number[] }>,
    munis: [] as { box: number[]; path: string }[],
  },
  Sim: { UFS: ["PE"] },
  isPointInPath: vi.fn(),
}));
vi.mock(
  "../../apps/web/src/features/projetar/ui/municipios-e-distritos-2.js",
  () => ({ zt: {} }),
);
vi.mock(
  "../../apps/web/src/features/projetar/ui/apuracao-e-votos-1.js",
  () => ({ Nn: [] }),
);
vi.mock("../../apps/web/src/features/projetar/ui/mapa-selecao-1.js", () => ({
  Sl: vi.fn(),
}));
vi.mock("../../apps/web/src/features/projetar/geography.js", () => ({
  Geo: mocks.Geo,
}));
vi.mock("../../apps/web/src/features/projetar/ui/mapa-geometria-1.js", () => ({
  FrState: {},
  Tr: vi.fn(),
}));
vi.mock("../../apps/web/src/features/projetar/simulation.js", () => ({
  Sim: mocks.Sim,
}));
vi.mock("../../apps/web/src/features/projetar/ui/mapa-dados-1.js", () => ({
  Uo: { isPointInPath: mocks.isPointInPath },
}));
// @ts-expect-error O módulo legado JavaScript não possui declarações TypeScript.
import { localizarMunicipio } from "../../apps/web/src/features/projetar/ui/desenho-alvos.js";

beforeEach(() => {
  mocks.Geo.ufs = { PE: { box: [0, 0, 10, 10], munis: [0, 1] } };
  mocks.Geo.munis = [
    { box: [0, 0, 10, 10], path: "continente" },
    { box: [20, 20, 22, 22], path: "Fernando de Noronha" },
  ];
  mocks.isPointInPath.mockReset().mockReturnValue(true);
});

describe("seleção geográfica sem alterar enquadramento", () => {
  it("seleciona Fernando de Noronha fora da caixa continental de Pernambuco", () => {
    expect(localizarMunicipio(21, 21)).toEqual({ uf: "PE", muni: 1 });
    expect(mocks.isPointInPath).toHaveBeenCalledExactlyOnceWith(
      "Fernando de Noronha",
      21,
      21,
    );
    expect(mocks.Geo.ufs.PE!.box).toEqual([0, 0, 10, 10]);
  });
  it("mantém a seleção continental e rejeita o oceano sem testar polígonos", () => {
    expect(localizarMunicipio(5, 5)).toEqual({ uf: "PE", muni: 0 });
    mocks.isPointInPath.mockClear();
    expect(localizarMunicipio(15, 15)).toBeNull();
    expect(localizarMunicipio(30, 30)).toBeNull();
    expect(mocks.isPointInPath).not.toHaveBeenCalled();
  });
  it("a caixa de seleção não substitui o teste preciso do polígono", () => {
    mocks.isPointInPath.mockReturnValue(false);
    expect(localizarMunicipio(21, 21)).toBeNull();
    expect(mocks.isPointInPath).toHaveBeenCalledExactlyOnceWith(
      "Fernando de Noronha",
      21,
      21,
    );
  });
  it("recalcula limites ao receber uma nova geografia", () => {
    expect(localizarMunicipio(21, 21)).toEqual({ uf: "PE", muni: 1 });
    mocks.Geo.ufs.PE = { box: [0, 0, 10, 10], munis: [0, 1] };
    mocks.Geo.munis[1] = { box: [40, 40, 42, 42], path: "Fernando de Noronha" };
    expect(localizarMunicipio(41, 41)).toEqual({ uf: "PE", muni: 1 });
  });
});
