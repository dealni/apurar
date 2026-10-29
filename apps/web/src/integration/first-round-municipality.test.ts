import { expect, it } from "vitest";
import { firstRoundMunicipality } from "./first-round-municipality";
const data = () => ({
  uf: "AC",
  ibge: [1200013, 1200054],
  votos: { "22": [60, 0], "13": [30, 0], "14": [10, 0] },
});
it("identifica os candidatos por número e mantém o denominador do primeiro turno", () => {
  expect(firstRoundMunicipality(data(), "AC", "1200013")?.candidates).toEqual([
    { id: "13", name: "Lula", votes: 30, share: 0.3 },
    { id: "22", name: "Flávio Bolsonaro", votes: 60, share: 0.6 },
  ]);
});
it("preserva zero conhecido sem fabricar percentuais", () => {
  expect(
    firstRoundMunicipality(data(), "AC", 1200054)?.candidates.map((c) => [
      c.votes,
      c.share,
    ]),
  ).toEqual([
    [0, null],
    [0, null],
  ]);
});
it("recusa outra UF, cidade ausente, registro duplicado e valores incompletos", () => {
  expect(firstRoundMunicipality(data(), "AM", 1200013)).toBeNull();
  expect(firstRoundMunicipality(data(), "AC", 999)).toBeNull();
  expect(
    firstRoundMunicipality(
      { ...data(), ibge: [1200013, 1200013] },
      "AC",
      1200013,
    ),
  ).toBeNull();
  for (const value of [null, -1, NaN, "30"])
    expect(
      firstRoundMunicipality(
        { ...data(), votos: { ...data().votos, "13": [value] } },
        "AC",
        1200013,
      ),
    ).toBeNull();
  expect(
    firstRoundMunicipality(
      { ...data(), votos: { "22": [60], "14": [10] } },
      "AC",
      1200013,
    ),
  ).toBeNull();
});
