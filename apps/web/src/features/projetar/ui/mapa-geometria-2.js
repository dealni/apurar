import { paintGovernorMap } from "./official-map-presentation.js";
import { desenharCamada } from "./modelo-mapa-geometria-colunas.js";
import {
  prepararSelecao,
  desenharEstado,
} from "./modelo-mapa-geometria-estados.js";
import { desenharContornos } from "./modelo-mapa-geometria-contornos.js";
import { Ps, qt } from "./apuracao-e-votos-1.js";
import { Uu, FrState, Hu, Bu } from "./mapa-geometria-1.js";
import { Ku } from "./mapa-selecao-1.js";
import { Z } from "./formatacao-e-acessibilidade-1.js";

import { zt } from "./municipios-e-distritos-2.js";

export let Xi, Gu, Or, Fo, Rr;
export function initialize() {
  inicializarColunas();
  inicializarRenderizacao();
}
function inicializarColunas() {
  Xi = (t, e, n, s, a) => {
    const r = Ps(n),
      u = s ? r.uf[s] : r.max,
      i = s ? 3.4 : 2.3,
      c = a.record ? [] : null;
    (Uu.forEach((l, d) => {
      desenharCamada(t, e, n, s, a, r, u, i, c, l, d);
    }),
      c && (FrState.value = c));
  };
  Gu = (t, e, n, s) => {
    const a = Ps(t);
    return s * Math.min(1.25, Math.sqrt(Z(t, e) / (n ? a.uf[n] : a.max)));
  };
  Or = [
    "1200401",
    "2704302",
    "1600303",
    "1302603",
    "2927408",
    "2304400",
    "5300108",
    "3205309",
    "5208707",
    "2111300",
    "5103403",
    "5002704",
    "3106200",
    "1501402",
    "2507507",
    "4106902",
    "2611606",
    "2211001",
    "3304557",
    "2408102",
    "4314902",
    "1100205",
    "1400100",
    "4205407",
    "3550308",
    "2800308",
    "1721000",
  ]
    .map((t) => qt.get(t))
    .filter((t) => t != null);
}
function inicializarRenderizacao() {
  Fo = (t, e, n, s, a, r, u, i, c, l = {}) => {
    const { d, $, f } = prepararCanvas(t, e, n, s);
    const m = u === "pres" && i === "votes";
    if (!f) return;
    if (
      (f.setTransform(1, 0, 0, 1, 0, 0),
      f.clearRect(0, 0, d, $),
      c === "ZZ" && zt)
    ) {
      (f.setTransform(s, 0, 0, s, 0, 0), Ku(f, a, r, l));
      return;
    }
    if (u === "gov" && r.governor) {
      f.setTransform(s, 0, 0, s, 0, 0);
      paintGovernorMap(f, a, r.governor, c, l.town);
      return;
    }
    if (m && l.base) {
      (f.drawImage(l.base, 0, 0),
        f.setTransform(s, 0, 0, s, 0, 0),
        Xi(f, a, r, c, l));
      return;
    }
    (f.setTransform(s, 0, 0, s, 0, 0),
      f.save(),
      f.translate(a.ox, a.oy),
      f.scale(a.k, a.k));
    const { g, M, S, v, h, w, z, gt } = prepararSelecao(
      e,
      n,
      s,
      a,
      r,
      u,
      m,
      c,
      l,
    );
    for (const _ of gt)
      desenharEstado(f, s, a, r, u, i, c, l, m, S, v, h, w, z, _);
    desenharContornos(f, s, a, r, u, i, c, l, m, S, v, M, z, gt);
    (S && Hu(f, a, M),
      v && Bu(f, a, r, l.town, g, e, n),
      f.restore(),
      m && !l.landOnly && Xi(f, a, r, c, l));
  };
  Rr = zt
    ? zt.cities
        .map((t) => t.i)
        .sort((t, e) => zt.cities[e].el - zt.cities[t].el)
    : [];
}

function prepararCanvas(canvas, width, height, scale) {
  const d = Math.round(width * scale),
    $ = Math.round(height * scale);
  if (canvas.width !== d) canvas.width = d;
  if (canvas.height !== $) canvas.height = $;
  return { d, $, f: canvas.getContext("2d") };
}
