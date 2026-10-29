import {
  desenharMunicipio,
  corDaDisputa,
} from "./modelo-mapa-geometria-desenho.js";
import { Fs, _eState, _nState, Os, Go, Pi, gl, Ba } from "./mapa-dados-1.js";
import { Dt, nt, lt, pe, y, rt, ce } from "./formatacao-e-acessibilidade-1.js";
import { $t } from "./municipios-e-distritos-1.js";
import { Geo } from "../geography.js";

import { sa, Ks, Kn, tt, dt } from "./apuracao-e-votos-1.js";
export let Ha,
  Bi,
  Vu,
  Nu,
  Tr,
  qu,
  ia,
  Ui,
  ji,
  Bu,
  Hu,
  Lr,
  Gi,
  ba,
  Wi,
  Ki,
  t0,
  Pr,
  Al,
  Uu,
  Ir,
  ju;
export const HiState = {
  value: undefined,
};
export const FrState = {
  value: undefined,
};
export function initialize() {
  inicializarGeometria();
  inicializarCores();
  inicializarPadroes();
}
function inicializarGeometria() {
  Ha = (t) => (t == null ? Fs : _eState.value.fill(t));
  Bi = (t, e) =>
    Dt(t, e) <= 0
      ? Fs
      : _eState.value
        ? Ha(_eState.value.town(t, e))
        : _nState.value
          ? _nState.value.fill(e)
          : Os(nt(lt[pe(t, e)]))[Go(y(t, e))];
  Vu = (t) => {
    if (_eState.value)
      return t.f > 0 && _eState.value.zone ? Ha(_eState.value.zone(t)) : Fs;
    const e = t.race && t.race[0];
    if (!(t.f > 0) || !e || !(e.votes > 0)) return Fs;
    if (_nState.value) {
      const n = t.race.find((s) => s.k === _nState.value.k);
      return _nState.value.tone(n ? n.share : 0);
    }
    return Os(nt(e))[Go(e.share - (t.race[1] ? t.race[1].share : 0))];
  };
  HiState.value = null;
  Nu = (t, e, n, s) => {
    const a = $t(t, e, n)[s];
    if (!a) return Pi;
    if (_eState.value)
      return _eState.value.local ? Ha(_eState.value.local(n, s, a, t, e)) : Fs;
    if (_nState.value) {
      const i = a.list.find((c) => c.k === _nState.value.k);
      return _nState.value.tone(i ? i.share : 0);
    }
    const r = a.list[0],
      u = a.list[1];
    return r && r.votes > 0 ? Os(nt(r))[Go(r.share - (u ? u.share : 0))] : Fs;
  };
  Tr = (t, e, n, s) => {
    const a = Math.sqrt(e.el[n] || 0);
    return (
      Math.min(
        Math.max(3, 0.9 * t.gap * s),
        Math.max(2.4 + 0.12 * a, 6e-4 * a * s),
      ) / s
    );
  };
  qu = (() => {
    const t = Geo.box,
      e = t[2] - t[0],
      n = t[3] - t[1],
      s = new Path2D();
    return (s.rect(t[0] - 4 * e, t[1] - 4 * n, 9 * e, 9 * n), s);
  })();
  ia = {
    key: "",
    cv: null,
    t: 0,
  };
  Ui = (t) => {
    const e = new Path2D();
    return (e.addPath(qu), e.addPath(Geo.munis[t].path), e);
  };
  ji = (t, e, n, s, a) => {
    ((t.fillStyle = "rgba(8,9,10,.55)"),
      t.fill(Ui(n), "evenodd"),
      t.save(),
      t.clip(Geo.munis[n].path, "evenodd"),
      (t.fillStyle = "#23252a"),
      t.fill(Geo.munis[n].path, "evenodd"),
      t.restore());
  };
  Bu = desenharMunicipio;
}
function inicializarCores() {
  Hu = (t, e, n) => {
    t.globalAlpha = 1;
    for (const s of n.rows)
      n.Z.has[s.j] &&
        s.f != null &&
        ((t.fillStyle = Vu(s)), t.fill(n.Z.paths[s.j], "evenodd"));
    ((t.strokeStyle = gl), (t.lineWidth = 1.1 / e.k), (t.lineJoin = "round"));
    for (const s of n.rows) n.Z.has[s.j] && t.stroke(n.Z.paths[s.j]);
  };
  Lr = (t, e) => {
    const n = sa(t, e);
    return t.pst <= 0
      ? "none"
      : n === "segundo-turno"
        ? "run"
        : n === "eleito" || n === "eleitos"
          ? "done"
          : "cnt";
  };
  Gi = (t, e) => {
    if (!Ks(t, e))
      return {
        fill: "#0f1011",
        ink: "#8a8f98",
        tex: null,
        off: !0,
      };
    if (t.pst <= 0)
      return {
        fill: Fs,
        ink: "#8a8f98",
        tex: null,
      };
    if (e === "pres" && _nState.value) {
      const d = _nState.value.ofUF(t),
        $ = _nState.value.tone(d.share);
      return {
        fill: $,
        ink: Ba($, rt(d.partido).on),
        tex: null,
      };
    }
    if (e === "pres") {
      const d = Kn(t, e),
        $ = rt(d[0].partido),
        f = Os($.cor)[Go(d[0].share - d[1].share)];
      return {
        fill: f,
        ink: Ba(f, $.on),
        tex: null,
      };
    }
    return corDaDisputa(t, e);
  };
}
function inicializarPadroes() {
  ba = new Map();
  Wi = (t, e, n, s) => {
    const a = e + "@" + n;
    if (!ba.has(a)) {
      ba.size > 48 && ba.clear();
      const r = document.createElement("canvas"),
        u = Math.max(4, Math.round(8 * n));
      ((r.width = r.height = u), s(r.getContext("2d"), u), ba.set(a, r));
    }
    return t.createPattern(ba.get(a), "repeat");
  };
  Ki = (t, e, n = "rgba(8,9,10,.45)") =>
    Wi(t, "hatch" + n, e, (s, a) => {
      ((s.strokeStyle = n),
        (s.lineWidth = Math.max(1, 1.1 * e)),
        s.beginPath());
      for (const r of [-a, 0, a]) (s.moveTo(r, a), s.lineTo(r + a, 0));
      s.stroke();
    });
  t0 = (t, e, n, s) =>
    Wi(t, "bands" + n + s, e, (a, r) => {
      ((a.fillStyle = n),
        a.fillRect(0, 0, r, r),
        (a.fillStyle = s),
        a.beginPath(),
        a.moveTo(0, 0),
        a.lineTo(r / 2, 0),
        a.lineTo(0, r / 2),
        a.closePath(),
        a.moveTo(0, r),
        a.lineTo(r, 0),
        a.lineTo(r, r / 2),
        a.lineTo(r / 2, r),
        a.closePath(),
        a.fill());
    });
  Pr = {};
  Al = (t) => {
    if (!Pr[t]) {
      const e = new Path2D();
      for (const n of Geo.ufs[t].munis) e.addPath(Geo.munis[n].path);
      Pr[t] = e;
    }
    return Pr[t];
  };
  Uu = (() => {
    const t = tt.slice().sort((n, s) => Geo.munis[n].c[1] - Geo.munis[s].c[1]),
      e = Math.ceil(dt / 8);
    return [...Array(8)].map((n, s) => t.slice(s * e, s * e + e));
  })();
  Ir = new Map();
  ju = (t) => (
    Ir.has(t) ||
      Ir.set(
        t,
        `rgb(${ce(t)
          .map((e) => Math.round(e + (250 - e) * 0.2))
          .join()})`,
      ),
    Ir.get(t)
  );
  FrState.value = [];
}
