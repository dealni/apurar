import { Bi, Ki } from "./mapa-geometria-1.js";

import { Dt } from "./formatacao-e-acessibilidade-1.js";
import { Geo } from "../geography.js";

import { _eState, Fs, gl } from "./mapa-dados-1.js";

import { zr } from "./mapa-dados-2.js";

export function desenharContornos(f, s, a, r, u, i, c, l, m, S, v, M, z, gt) {
  if (
    ((f.globalAlpha = 1),
    (f.lineJoin = "round"),
    u === "pres" && (i !== "uf" || c) && r.towns && !zr())
  )
    if (
      ((f.strokeStyle = m ? "rgba(250,250,249,.045)" : "rgba(15,14,13,.3)"),
      (f.lineWidth = 0.5 / a.k),
      z)
    )
      f.stroke(Geo.lines.muni);
    else for (const _ of gt) f.stroke(Geo.ufs[_].muniLines);
  if (
    ((f.strokeStyle = m ? "rgba(250,250,249,.2)" : gl),
    (f.lineWidth = (m ? 1 : 1.4) / a.k),
    f.stroke(Geo.lines.uf),
    (f.strokeStyle = "rgba(250,250,249,.12)"),
    (f.lineWidth = 1 / a.k),
    f.stroke(Geo.lines.edge),
    c &&
      ((f.strokeStyle = "rgba(250,250,249,.6)"),
      (f.lineWidth = 1.4 / a.k),
      f.stroke(Geo.ufs[c].outline)),
    l.town != null)
  ) {
    destacarMunicipio(f, s, a, l, S, v, M);
  }
}
export function desenharMunicipios(f, s, a, r, c, l, S, v, h, w, z, _) {
  const Y = c === _ && l.town != null,
    E = S || v ? null : l.town,
    T = z
      ? Geo.ufs[_].munis
      : Geo.ufs[_].munis.filter((Ct) => w(Geo.munis[Ct].box));
  for (const Ct of T)
    ((f.globalAlpha = c && _ !== c ? 0.13 : Y && Ct !== E ? 0.38 : 1),
      (f.fillStyle = l.hold && l.hold.has(Ct) ? Fs : Bi(r, Ct)),
      f.fill(Geo.munis[Ct].path));
  if (c === _ && (!_eState.value || _eState.value.hatch)) {
    desenharHachuras(f, s, a, r, l, h, Y, E, T);
  }
}

function destacarMunicipio(f, s, a, l, S, v, M) {
  if (
    (f.save(),
    (f.shadowColor = "rgba(250,250,249,.35)"),
    (f.shadowBlur = 8 * s),
    (f.strokeStyle = "#FAFAF9"),
    (f.lineWidth = (S || v ? 4 : 2) / a.k),
    S)
  )
    for (const _ of M.rows) M.Z.has[_.j] && f.stroke(M.Z.paths[_.j]);
  else f.stroke(Geo.munis[l.town].path);
  f.restore();
}

function desenharHachuras(f, s, a, r, l, h, Y, E, T) {
  const Ct = Ki(f, s);
  (Ct.setTransform(h), (f.fillStyle = Ct));
  for (const xt of T) {
    const Bt = Dt(r, xt);
    Bt > 0 &&
      Bt < 1 &&
      (!Y || xt === E) &&
      !(l.hold && l.hold.has(xt)) &&
      f.fill(Geo.munis[xt].path);
  }
}
