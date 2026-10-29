import {
  du,
  fu,
  dl,
  to,
  Un,
  qoState,
  ll,
  va,
  pr,
} from "./eventos-e-progresso-1.js";
import { Fn, bn } from "./apuracao-e-votos-1.js";
import { Sim } from "../simulation.js";
import { atualizarViradas, curvaAtualState } from "./contagem-e-animacao-1.js";
import { lt, yt, html, pt, Oe, _t } from "./formatacao-e-acessibilidade-1.js";
import { We, Fe } from "../object-helpers.js";
import { zt } from "./municipios-e-distritos-2.js";
import { Rr } from "./mapa-geometria-2.js";
export let fi;
export function initialize() {
  fi = (t) => {
    const e = t.nat;
    du(t);
    fu(t);
    const indice = Fn.findIndex((ponto) => ponto.t === t.t);
    const n = Fn[indice];
    if (n && !n.part && (t.seq ?? t.t) === (n.seq ?? n.t)) return !1;
    const s = {
      t: t.t,
      seq: t.seq,
      pst: e.pst,
      sh: e.cand.map((l) =>
        (e.base ?? e.valid) ? l / (e.base ?? e.valid) : 0,
      ),
      lead: e.order[0],
      second: e.order[1],
      status: e.status,
      gov: Sim.UFS.map((l) => t.uf[l].govStatus),
      sen: Sim.UFS.map((l) => t.uf[l].senStatus),
      gov2: Sim.UFS.map((l) => dl(t.uf[l].gov)),
      sen2: Sim.UFS.map((l) => dl(t.uf[l].sen)),
    };
    if (indice < 0) Fn.push(s);
    else Fn[indice] = s;
    Fn.sort((a, b) => a.t - b.t);
    curvaAtualState.value = s;
    atualizarViradas();
    const a = Fn.indexOf(s);
    registrarDefinicao(e, s, a);
    registrarExterior(t, s, a);
    return !0;
  };
}

function registrarDefinicao(e, s, indice) {
  const r = (l) => (l != null ? l : indice > 0 ? s.t : null);
  if (!qoState.value && s.status !== "apurando") {
    const l = r(e.definido);
    qoState.value = We(Fe({}, s), {
      t: l,
    });
    const d = lt[s.lead],
      $ = lt[s.second],
      f = s.status !== "eleito",
      m = () =>
        f
          ? html`${Un(d)} e ${Un($)} vão ao 2º turno`
          : html`${Un(d)} é ${pt(d) ? "eleita" : "eleito"} presidente${ll}`;
    l != null &&
      to({
        t: l,
        at: s.t,
        big: s.status,
        cand: d,
        cand2: f ? $ : null,
        say: f
          ? `${yt(d)} e ${yt($)} vão ao 2º turno.`
          : `${yt(d)} é ${pt(d) ? "eleita" : "eleito"} presidente${ll}.`,
        short: m,
        line: () => html`${m()}.`,
      });
  }
}

function registrarExterior(t, s, indice) {
  const u = t.uf.ZZ,
    i = Fn[indice - 1],
    c = i && i.zz != null ? i.zz : !i && s.t <= Oe ? 0 : null;
  s.zz = u ? u.pst : null;
  if (!zt || !u || c == null) return;

  const lider = () => {
    const d = u.cand.indexOf(Math.max(...u.cand));
    return [lt[d], (u.base ?? u.valid) ? u.cand[d] / (u.base ?? u.valid) : 0];
  };
  registrarPrimeirosVotosExterior(t, s, u, c);
  registrarMetadeExterior(s, u, c, lider);
  registrarConclusaoExterior(s, u, c, lider);
}

function registrarPrimeirosVotosExterior(t, s, u, c) {
  if (!va.has("zz0") && u.pst > 0 && c <= 0) {
    va.add("zz0");
    const d = Rr.filter(($) => bn(t, $) > 0)
      .slice(0, 3)
      .map(($) => zt.cities[$].name);
    to({
      t: s.t,
      uf: "ZZ",
      office: "pres",
      zz: !0,
      line: () =>
        d.length
          ? html`Exterior: ${pr(d)} trazem os primeiros votos da noite.`
          : html`Exterior: os primeiros votos da noite vêm de fora do país.`,
    });
  }
}

function registrarMetadeExterior(s, u, c, lider) {
  if (!va.has("zz5") && u.pst >= 0.5 && c < 0.5) {
    va.add("zz5");
    const [d, $] = lider();
    to({
      t: s.t,
      uf: "ZZ",
      office: "pres",
      cand: d,
      line: () =>
        html`Exterior: com metade das seções, ${Un(d)} lidera fora do país, com
        ${_t($)}%.`,
    });
  }
}

function registrarConclusaoExterior(s, u, c, lider) {
  if (!va.has("zz1") && u.pst >= 1 && c < 1) {
    va.add("zz1");
    const [d, $] = lider();
    to({
      t: s.t,
      uf: "ZZ",
      office: "pres",
      cand: d,
      line: () =>
        html`Exterior apurado: ${Un(d)} tem ${_t($)}% dos votos computados das
        candidaturas fora do país.`,
    });
  }
}
