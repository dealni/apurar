import { showMapResults } from "./map-actions";
import { test, expect, type Page } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockEmptyDetails, mockManifest } from "./bundle-fixture";
import ids from "../apps/web/src/integration/municipality-ids.json" with { type: "json" };

type Geometry = {
  type: "Polygon" | "MultiPolygon";
  arcs: number[][] | number[][][];
  properties: { id: string; n: string; uf: string };
};
type Topology = {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: { municipios: { geometries: Geometry[] } };
};
type MapWindow = Window & {
  BRASIL: Topology;
  __mapMatrix?: number[];
};

async function settleCard(page: Page, title: string) {
  const card = page.locator("section.card").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
  await showMapResults(page);
  await expect(card).toBeInViewport();
  await expect
    .poll(() =>
      card.evaluate((node) => {
        let current: Element | null = node;
        while (current) {
          if (Number(getComputedStyle(current).opacity) < 0.99) return false;
          current = current.parentElement;
        }
        return true;
      }),
    )
    .toBe(true);
}

async function officialBundle(page: Page) {
  const now = new Date().toISOString();
  const snapshot = {
    ...demo,
    snapshot_id: "map-coverage",
    mode: "live",
    source: { ...demo.source, as_of: now, collected_at: now },
    published_at: now,
  };
  await mockManifest(page, () => snapshot.snapshot_id);
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(snapshot),
    }),
  );
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        schema_version: 1,
        election: "6258",
        snapshot_id: snapshot.snapshot_id,
        items: [
          {
            scope: "municipality",
            unit_id: "MT:73709",
            ibge: "5101837",
            uf: "MT",
            name: "Boa Esperança do Norte",
            available: true,
            as_of: now,
            sections: { counted: 5, total: 13 },
            candidates: [
              { id: "01", votes: 600 },
              { id: "02", votes: 400 },
            ],
          },
        ],
      }),
    }),
  );
}

test("malha carregada cobre exatamente todas as 5.571 localidades do cadastro TSE", async ({
  page,
}) => {
  await officialBundle(page);
  await page.goto("/apurar/");
  await expect(page.locator("canvas.map").first()).toBeVisible();
  const geometries = await page.evaluate(() =>
    (window as unknown as MapWindow).BRASIL.objects.municipios.geometries.map(
      (shape) => ({
        id: String(shape.properties.id),
        name: shape.properties.n,
        uf: shape.properties.uf,
        polygons: shape.arcs.length,
      }),
    ),
  );
  expect(geometries).toHaveLength(5571);
  expect(new Set(geometries.map((geometry) => geometry.id)).size).toBe(5571);
  expect(geometries.map((geometry) => geometry.id).sort()).toEqual(
    Object.keys(ids).sort(),
  );
  expect(geometries.every((geometry) => geometry.polygons > 0)).toBe(true);
  expect(geometries).toContainEqual({
    id: "5101837",
    name: "Boa Esperança do Norte",
    uf: "MT",
    polygons: expect.any(Number),
  });
});

test("Boa Esperança do Norte aparece na busca e seleciona seus dados municipais", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await officialBundle(page);
  await page.goto("/apurar/");
  await page
    .getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    })
    .click();
  await page.getByRole("combobox").fill("Boa Esperança do Norte");
  const result = page.getByRole("option").filter({
    hasText: "Boa Esperança do Norte",
  });
  await expect(result).toHaveCount(1);
  await result.click();
  await expect(page).toHaveURL(/#presidente-mt-5101837$/);
  const card = page.locator("section.card").filter({
    has: page.getByRole("heading", {
      name: "Boa Esperança do Norte",
      exact: true,
    }),
  });
  await expect(card).toBeVisible();
  await expect(card).toContainText("5 de 13 seções totalizadas");
  await expect(card).toContainText("60,0");
  await expect(card).toContainText("40,0");
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
  await settleCard(page, "Boa Esperança do Norte");
  await page.screenshot({
    path: test.info().outputPath("boa-esperanca-do-norte.png"),
    fullPage: true,
  });
});

test("clique no polígono real de Fernando de Noronha seleciona a ilha", async ({
  page,
}) => {
  // Observa a matriz efetivamente usada para desenhar o mapa, sem alterar
  // geometria, enquadramento, detector de alvos ou eventos da aplicação.
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fill;
    const counts = new Map<string, number>();
    let maximum = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.className === "map") {
        counts.clear();
        maximum = 0;
      }
      return Reflect.apply(clear, this, args);
    };
    CanvasRenderingContext2D.prototype.fill = function (
      ...args:
        | [(CanvasFillRule | undefined)?]
        | [Path2D, (CanvasFillRule | undefined)?]
    ) {
      if (this.canvas.className === "map" && args[0] instanceof Path2D) {
        const matrix = this.getTransform();
        if (matrix.a > 0 && matrix.d > 0 && (matrix.e || matrix.f)) {
          const values = [
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
            matrix.e,
            matrix.f,
          ];
          const key = JSON.stringify(values);
          const count = (counts.get(key) ?? 0) + 1;
          counts.set(key, count);
          if (count > maximum) {
            maximum = count;
            (window as unknown as MapWindow).__mapMatrix = values;
          }
        }
      }
      return Reflect.apply(original, this, args);
    };
  });
  await officialBundle(page);
  await page.goto("/apurar/#presidente-pe");
  const canvas = page.locator("canvas.map").first();
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as MapWindow).__mapMatrix?.length),
    )
    .toBe(6);
  async function settleMap() {
    let previous = "";
    let stable = 0;
    await expect
      .poll(
        async () => {
          const current = JSON.stringify(
            await page.evaluate(
              () => (window as unknown as MapWindow).__mapMatrix,
            ),
          );
          stable = current === previous ? stable + 1 : 0;
          previous = current;
          return stable;
        },
        { intervals: [200] },
      )
      .toBeGreaterThanOrEqual(3);
  }
  await settleMap();
  const islandPoint = () =>
    page.evaluate(() => {
      const { BRASIL: topology, __mapMatrix: matrix } =
        window as unknown as MapWindow;
      if (!matrix) throw new Error("Transformação do mapa ausente");
      const [sx, sy] = topology.transform.scale;
      const [tx, ty] = topology.transform.translate;
      let minX = Infinity;
      let minY = Infinity;
      const arcs = topology.arcs.map((arc) => {
        let x = 0;
        let y = 0;
        return arc.map(([dx, dy]) => {
          x += dx;
          y += dy;
          const point: [number, number] = [
            (x * sx + tx) / 1000,
            -(y * sy + ty) / 1000,
          ];
          minX = Math.min(minX, point[0]);
          minY = Math.min(minY, point[1]);
          return point;
        });
      });
      const geometry = topology.objects.municipios.geometries.find(
        (shape) => String(shape.properties.id) === "2605459",
      );
      if (!geometry) throw new Error("Polígono de Fernando de Noronha ausente");
      const polygons =
        geometry.type === "Polygon"
          ? [geometry.arcs as number[][]]
          : (geometry.arcs as number[][][]);
      const path = new Path2D();
      const bounds = [Infinity, Infinity, -Infinity, -Infinity];
      for (const polygon of polygons)
        for (const ring of polygon) {
          let started = false;
          for (const index of ring) {
            const source = arcs[index < 0 ? ~index : index];
            if (!source) throw new Error("Arco inválido");
            const points = index < 0 ? source.slice().reverse() : source;
            for (const [rawX, rawY] of points) {
              const x = rawX - minX;
              const y = rawY - minY;
              if (started) path.lineTo(x, y);
              else path.moveTo(x, y);
              started = true;
              bounds[0] = Math.min(bounds[0]!, x);
              bounds[1] = Math.min(bounds[1]!, y);
              bounds[2] = Math.max(bounds[2]!, x);
              bounds[3] = Math.max(bounds[3]!, y);
            }
          }
          path.closePath();
        }
      const context = document.createElement("canvas").getContext("2d")!;
      const canvas = document.querySelector<HTMLCanvasElement>("canvas.map")!;
      const rect = canvas.getBoundingClientRect();
      const order = Array.from({ length: 49 }, (_, index) => index + 1).sort(
        (left, right) => Math.abs(left - 25) - Math.abs(right - 25),
      );
      let fallback:
        | { x: number; y: number; matrix: number[]; clickable: boolean }
        | undefined;
      for (const row of order)
        for (const column of order) {
          const x = bounds[0]! + ((bounds[2]! - bounds[0]!) * column) / 50;
          const y = bounds[1]! + ((bounds[3]! - bounds[1]!) * row) / 50;
          if (!context.isPointInPath(path, x, y, "evenodd")) continue;
          const screenX =
            rect.x +
            ((matrix[0]! * x + matrix[4]!) * rect.width) / canvas.width;
          const screenY =
            rect.y +
            ((matrix[3]! * y + matrix[5]!) * rect.height) / canvas.height;
          fallback ??= { x: screenX, y: screenY, matrix, clickable: false };
          const roundedX = Math.round(screenX);
          const roundedY = Math.round(screenY);
          const inverseX =
            (((roundedX - rect.x) * canvas.width) / rect.width - matrix[4]!) /
            matrix[0]!;
          const inverseY =
            (((roundedY - rect.y) * canvas.height) / rect.height - matrix[5]!) /
            matrix[3]!;
          if (context.isPointInPath(path, inverseX, inverseY, "evenodd"))
            return { x: roundedX, y: roundedY, matrix, clickable: true };
        }
      if (fallback) return fallback;
      throw new Error("Não foi encontrado ponto interior à ilha");
    });
  let point = await islandPoint();
  const viewport = page.viewportSize()!;
  const unobstructed = () =>
    page.evaluate(
      ({ x, y }) =>
        document.elementFromPoint(x, y)?.matches("canvas.map") ?? false,
      point,
    );
  for (
    let step = 0;
    step < 8 &&
    (point.x < 0 ||
      point.x >= viewport.width ||
      point.y < 0 ||
      point.y >= viewport.height ||
      !(await unobstructed()));
    step++
  ) {
    await page.keyboard.press("-");
    await settleMap();
    point = await islandPoint();
  }
  for (let step = 0; step < 6 && !point.clickable; step++) {
    const before = JSON.stringify(point.matrix);
    await page.mouse.move(point.x, point.y);
    await page.mouse.wheel(0, -300);
    await expect
      .poll(async () => JSON.stringify((await islandPoint()).matrix))
      .not.toBe(before);
    await settleMap();
    point = await islandPoint();
  }
  expect(point.clickable, "há pixel inteiro dentro do polígono da ilha").toBe(
    true,
  );
  expect(await unobstructed(), "o polígono está acessível no canvas").toBe(
    true,
  );
  expect(point.x).toBeGreaterThan(0);
  expect(point.y).toBeGreaterThan(0);
  expect(point.x).toBeLessThan(page.viewportSize()!.width);
  expect(point.y).toBeLessThan(page.viewportSize()!.height);
  if (test.info().project.name === "mobile")
    await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await expect(page).toHaveURL(/#presidente-pe-2605459$/);
  await expect(
    page.getByRole("heading", { name: "Fernando de Noronha", exact: true }),
  ).toBeVisible();
  await settleCard(page, "Fernando de Noronha");
  await settleMap();
  await page.screenshot({
    path: test.info().outputPath("fernando-de-noronha-selecionado.png"),
    fullPage: true,
  });
});
