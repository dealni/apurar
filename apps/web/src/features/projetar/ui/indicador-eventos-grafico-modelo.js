import { ss, Fn, oa, al } from "./apuracao-e-votos-1.js";
import { lt, Vt, ie } from "./formatacao-e-acessibilidade-1.js";

/** Escalas e séries preservam os mesmos pontos e margens do gráfico original. */
export function prepararGrafico(t, e, n, a) {
  const r = n >= 84,
    u = n < 120 ? 0.04 : 0.02,
    i = r ? 34 : 0,
    c = a ? 46 : 6,
    l = 6,
    d = r ? 18 : 6,
    $ = [t.pres[0], t.pres[1]].sort(ss).map((D) => D.k),
    f = Fn.filter((D) => D.t <= t.t && D.pst >= 0.01),
    m = f.filter((D) => D.pst >= 0.05),
    h = f.filter((D) => D.pst < 0.051),
    g =
      oa && $.every((D) => al(lt[D], oa.p[0]) != null)
        ? oa.p.filter((D) => D[0] >= 0.05)
        : [],
    projection = Vt(t),
    v = projection?.pre_count ? null : projection,
    M = (D) => v.by[+lt[D].n],
    S = (m.length ? m : f)
      .flatMap((D) => $.map((q) => D.sh[q]))
      .concat(
        g.flatMap((D) => $.map((q) => al(lt[q], D))),
        v ? $.map((D) => M(D)) : [],
      ),
    x = Math.floor(((S.length ? Math.min(...S) : 0.35) - 0.01) / u) * u,
    w = Math.max(
      x + 2 * u,
      Math.ceil(((S.length ? Math.max(...S) : 0.5) + 0.01) / u) * u,
    ),
    z = (D) => i + D * (e - i - c),
    gt = (D) => l + (1 - (ie(D, x, w) - x) / (w - x)) * (n - l - d),
    _ = (D, q) =>
      q
        .map(
          (le, be) =>
            `${be ? "L" : "M"}${z(le.pst).toFixed(1)},${gt(le.sh[D]).toFixed(1)}`,
        )
        .join(""),
    j = [];
  for (let D = x; D <= w + 1e-9; D += u) j.push(+D.toFixed(2));
  return { r, i, c, $, f, m, h, g, v, M, z, gt, _, j };
}

export function separarRotulos(Ae) {
  if (Ae.length !== 2) return Ae;
  const [D, q] = Ae[0].y <= Ae[1].y ? Ae : [Ae[1], Ae[0]];
  if (q.y - D.y < 13) {
    const le = (D.y + q.y) / 2;
    D.y = le - 6.5;
    q.y = le + 6.5;
  }
  return Ae;
}

export function criarRotulos(a, E, $, v, M, z, gt) {
  if (!a || !E) return [];
  return separarRotulos(
    $.map((D) => ({
      k: D,
      c: lt[D],
      v: v ? M(D) : E.sh[D],
      x: v ? z(1) + 4 : z(E.pst) + 8,
      y: gt(v ? M(D) : E.sh[D]),
    })),
  );
}
