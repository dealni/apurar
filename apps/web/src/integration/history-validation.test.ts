import { expect, it } from "vitest";
import { demo } from "../demo";
import { parseHistory, type HistoryPoint } from "../feeds";
import { parseSnapshot } from "../../../../packages/contracts/snapshot";

const snapshot = () =>
  parseSnapshot({
    ...structuredClone(demo),
    mode: "live",
    published_at: "2026-10-24T10:00:00Z",
    source: {
      ...demo.source,
      as_of: "2026-10-24T10:00:00Z",
      collected_at: "2026-10-24T10:00:00Z",
    },
    totals: {
      valid: 4500000,
      blank: 0,
      null: 0,
      turnout: 4500001,
      electorate: 5000000,
      annulled: 1,
    },
    projection: {
      available: false,
      model: "experimental",
      reason: "Destinações incompatíveis.",
      shares: null,
    },
  });
const point = (): HistoryPoint => ({
  snapshot_id: "historical",
  as_of: "2026-10-24T09:59:00Z",
  sections: { counted: 10000, total: 50000 },
  candidates: [
    { id: "01", votes: 100 },
    { id: "02", votes: 90 },
  ],
  projection: structuredClone(demo.projection),
});
const history = (value: HistoryPoint) => ({
  schema_version: 1,
  election: "6258",
  points: [value],
});

it("valida projeção histórica sem herdar destinações e totais atuais", () => {
  const current = snapshot();
  expect(
    parseHistory(history(point()), current)[0]?.projection?.available,
  ).toBe(true);
  expect(current.projection.available).toBe(false);
  expect(current.totals?.annulled).toBe(1);
});

it.each([true, false])(
  "rejeita votos históricos sem seções com projeção presente=%s",
  (projection) => {
    const value = point();
    value.sections.counted = 0;
    if (!projection) delete value.projection;
    expect(() => parseHistory(history(value), snapshot())).toThrow(
      "Votos sem seções",
    );
  },
);

it("preserva a validação dos percentuais da observação histórica", () => {
  const value = point();
  value.projection!.shares = { "01": 60, "02": 60 };
  expect(() => parseHistory(history(value), snapshot())).toThrow(
    "Soma inválida",
  );
});
