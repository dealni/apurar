import { describe, expect, it } from "vitest";
import { candidatePortrait } from "../runtime/candidate-portraits";

describe("identidade dos retratos oficiais", () => {
  it("distingue mesmo número e partido em estados diferentes", () => {
    expect(
      candidatePortrait(
        { n: 11, name: "Mailza Assis", partido: "PP" },
        { office: "governor", uf: "AC" },
      ),
    ).toBe("/candidates/ac-11-10002544107.webp");
    expect(
      candidatePortrait(
        { n: 11, name: "Mailza Assis", partido: "PP" },
        { office: "governor", uf: "DF" },
      ),
    ).toBeNull();
  });

  it("recusa número sem nome, partido divergente e SQ de outra pessoa", () => {
    expect(candidatePortrait({ n: 22, partido: "PL" })).toBeNull();
    expect(
      candidatePortrait({ n: 13, name: "Lula", partido: "PL" }),
    ).toBeNull();
    expect(
      candidatePortrait({
        n: 13,
        name: "Lula",
        partido: "PT",
        sq: "280002551544",
      }),
    ).toBeNull();
  });

  it("aceita acentos e o identificador presidencial da integração", () => {
    expect(
      candidatePortrait({
        id: "p22",
        name: "Flávio Bolsonaro",
        partido: "PL",
      }),
    ).toBe("/candidates/br-22-280002551544.webp");
  });

  it("preserva a identidade presidencial nos recortes estadual e exterior", () => {
    for (const uf of ["BR", "SP", "ZZ"])
      expect(
        candidatePortrait(
          { id: "13", name: "Lula", party: "PT" },
          { office: "president", uf },
        ),
      ).toBe("/candidates/br-13-280002542548.webp");
  });
});
