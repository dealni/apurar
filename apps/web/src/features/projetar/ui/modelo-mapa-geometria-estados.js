import { Al } from "./mapa-geometria-1.js";

import { Geo } from "../geography.js";

import { En, vn, wt } from "./municipios-e-distritos-1.js";
import { _eState, Va } from "./mapa-dados-1.js";
import { Sim } from "../simulation.js";
import { zr, Ml } from "./mapa-dados-2.js";

import { desenharMunicipios } from "./modelo-mapa-geometria-contornos.js";
export function prepararSelecao(e, n, s, a, r, u, m, c, l) {
  const h = new DOMMatrix([1 / (s * a.k), 0, 0, 1 / (s * a.k), 0, 0]),
    g = l.town != null && u === "pres" && !m && r.towns ? En(r, l.town) : null,
    v = !!g,
    M = selecionarZonas(v, l, u, m, r),
    S = !!M && M.ready && M.rows.some((_) => M.Z.has[_.j]),
    x = [
      -a.ox / a.k - 8,
      -a.oy / a.k - 8,
      (e - a.ox) / a.k + 8,
      (n - a.oy) / a.k + 8,
    ],
    w = (_) => _[2] >= x[0] && _[0] <= x[2] && _[3] >= x[1] && _[1] <= x[3],
    z = w(Geo.box) && (Geo.box[2] - Geo.box[0]) * a.k < (e + n) * 1.5,
    gt = z ? Sim.UFS : Sim.UFS.filter((_) => w(Geo.ufs[_].box) || _ === c);

  return { g, M, S, v, h, w, z, gt };
}
export function desenharEstado(f, s, a, r, u, i, c, l, m, S, v, h, w, z, _) {
  if (((f.globalAlpha = c && _ !== c ? 0.13 : 1), m)) {
    ((f.fillStyle = Va), f.fill(Al(_)));
    return;
  }
  if (
    u === "pres" &&
    (i === "mun" || i === "cand" || _eState.value || c === _) &&
    r.towns &&
    !zr()
  ) {
    desenharMunicipios(f, s, a, r, c, l, S, v, h, w, z, _);
    return;
  }
  const j = Ml(r.ufs[_], u);
  if (((f.fillStyle = j.fill), f.fill(Al(_)), j.split)) {
    const Y = Geo.ufs[_].box,
      E = f.createLinearGradient(Y[0], Y[1], Y[2], Y[3]);
    (E.addColorStop(0, j.split[0]),
      E.addColorStop(0.5, j.split[0]),
      E.addColorStop(0.5, j.split[1]),
      E.addColorStop(1, j.split[1]),
      (f.fillStyle = E),
      f.fill(Al(_)));
  }
}

function selecionarZonas(v, l, u, m, r) {
  return !v &&
    l.town != null &&
    u === "pres" &&
    !m &&
    r.towns &&
    !(_eState.value && !_eState.value.zone) &&
    !vn(r, l.town)
    ? wt(r, l.town)
    : null;
}
