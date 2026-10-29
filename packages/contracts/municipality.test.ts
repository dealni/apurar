import { describe, expect, it } from "vitest";
import { validateCollection } from "../../apps/edge/src/collections";
import { parseMunicipalities } from "../../apps/web/src/feeds";
import { municipalTotalFields, validateMunicipality } from "./municipality";

const totals = {
  electorate: 10208,
  electorate_totalized: 100,
  electorate_installed: 100,
  turnout: 70,
  abstention: 30,
  valid: 0,
  computed: 60,
  blank: 4,
  null: 6,
  annulled: 40,
  sub_judice: 20,
  total: 70,
};
const municipality = {
  scope: "municipality",
  uf: "AC",
  name: "Acrelândia",
  unit_id: "AC:01120",
  sections: { counted: 1, total: 25 },
  candidates: [
    { id: "13", votes: 40, validity: "Anulado" },
    { id: "22", votes: 20, validity: "Anulado sub judice" },
  ],
  available: true,
  as_of: "2026-10-24T10:00:00Z",
  totals,
};
function envelope(item: unknown) {
  return {
    schema_version: 1,
    election: "6258",
    snapshot_id: "municipal-totals-001",
    items: [item],
  };
}
const consumers = {
  contrato: (item: unknown) => validateMunicipality(item),
  Worker: (item: unknown) =>
    validateCollection(envelope(item), "municipalities"),
  navegador: (item: unknown) => parseMunicipalities(envelope(item)),
};

for (const [name, parse] of Object.entries(consumers)) {
  describe(`totais municipais no ${name}`, () => {
    it("preserva zero válido, computados distintos e destinação anulada", () => {
      expect(() => parse(municipality)).not.toThrow();
      const parsed = parseMunicipalities(envelope(municipality))[0]!;
      expect(parsed.totals).toEqual(totals);
      expect(parsed.candidates[0]!.validity).toBe("Anulado");
      expect(parsed.totals!.computed).not.toBe(parsed.totals!.valid);
    });
    it("aceita legado sem totais sem fabricar contagens", () => {
      const { totals: _totals, ...legacy } = municipality;
      expect(() => parse(legacy)).not.toThrow();
      expect(parseMunicipalities(envelope(legacy))[0]!.totals).toBeUndefined();
    });
    it("mantém desconhecidos como null e rejeita contagens ausentes", () => {
      const unknown = Object.fromEntries(
        municipalTotalFields.map((field) => [field, null]),
      );
      expect(() => parse({ ...municipality, totals: unknown })).not.toThrow();
      const { valid: _valid, ...incomplete } = totals;
      expect(() => parse({ ...municipality, totals: incomplete })).toThrow();
    });
    it("recusa negativos, NaN, frações, texto e inteiros inseguros", () => {
      for (const field of municipalTotalFields)
        for (const invalid of [-1, NaN, Infinity, 0.5, "0", 2 ** 53])
          expect(() =>
            parse({ ...municipality, totals: { ...totals, [field]: invalid } }),
          ).toThrow();
    });
    it("não aceita total confirmado em resultado indisponível", () => {
      const unavailable = {
        ...municipality,
        available: false,
        candidates: [],
        sections: { counted: null, total: null },
        as_of: null,
        totals: Object.fromEntries(
          municipalTotalFields.map((field) => [field, null]),
        ),
      };
      expect(() => parse(unavailable)).not.toThrow();
      expect(() =>
        parse({ ...unavailable, totals: { ...unavailable.totals, valid: 0 } }),
      ).toThrow();
    });
    it("valida votos, seções, fonte e metadados também no navegador", () => {
      for (const invalid of [
        { ...municipality, candidates: [{ id: "13", votes: -1 }] },
        {
          ...municipality,
          candidates: [
            municipality.candidates[0],
            { ...municipality.candidates[1], validity: 10 },
          ],
        },
        { ...municipality, sections: { counted: 0, total: 25 } },
        { ...municipality, as_of: "inválido" },
      ])
        expect(() => parse(invalid)).toThrow();
    });
  });
}
