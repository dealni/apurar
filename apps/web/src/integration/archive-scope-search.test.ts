import { expect, it } from "vitest";
import { filterArchiveRows, type ArchivedRow } from "./archive-client";

it("busca o escopo pelos rótulos em português exibidos no arquivo", () => {
  const rows = [
    "national",
    "state",
    "municipality",
    "municipal",
    "country",
    "city",
  ].map((scope, index): ArchivedRow => ({
    id: String(index),
    name: "Local de teste",
    uf: "ZZ",
    office: "Presidente",
    scope,
    as_of: null,
    available: false,
    sections: { counted: null, total: null },
    candidates: [],
    totals: {},
  }));
  for (const [query, scopes] of [
    ["Nacional", ["national"]],
    ["Estado", ["state"]],
    ["municipio", ["municipality", "municipal"]],
    ["país", ["country"]],
    ["Cidade", ["city"]],
  ] as const) {
    expect(
      filterArchiveRows(rows, query, "ZZ").map((row) => row.scope),
    ).toEqual(scopes);
  }
  expect(filterArchiveRows(rows, "país", "AC")).toEqual([]);
});
