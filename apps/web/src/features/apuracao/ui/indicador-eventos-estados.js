import {
  html,
  lt,
  Te,
  pt,
  _t,
  yt,
  ct,
  Dt,
  pe,
  y,
} from './formatacao-e-acessibilidade-1.js';
import { Sim } from '../simulation.js';
import { We, Fe } from '../object-helpers.js';
import { Or } from './mapa-geometria-2.js';
import { Mo } from './contagem-e-animacao-1.js';
import { Geo } from '../geography.js';
import { Feed } from '../feed.js';
import { Oa } from './candidatos-e-partidos-1.js';
import { rl, dl, Un, to, dr, pr, ai } from './eventos-e-progresso-1.js';

export function registrarCargos(t, i) {
  Sim.UFS.forEach((c, _l) => {
    const d = t.uf[c];
    if (d) {
      if (!rl.gov.has(c) && d.govStatus && d.govStatus !== 'apurando') {
        rl.gov.add(c);
        const [$, f] = dl(d.gov),
          m = d.govStatus === 'eleito',
          h = i(d.govAt);
        h != null &&
          $ &&
          to({
            t: h,
            uf: c,
            office: 'gov',
            cand: $,
            line: () =>
              m
                ? html`${Te[c]}: ${Un($)} é
                  ${pt($) ? 'eleita governadora' : 'eleito governador'}.`
                : html`${Te[c]}: ${Un($)} e ${Un(f)} vão ao 2º turno para
                  governador.`,
          });
      }
      if (!rl.sen.has(c) && d.senStatus === 'eleitos') {
        rl.sen.add(c);
        const [$, f] = dl(d.sen),
          m = i(d.senAt);
        m != null &&
          $ &&
          to({
            t: m,
            uf: c,
            office: 'sen',
            cand: $,
            line: () =>
              html`${Te[c]}: ${Un($)} e ${Un(f)} são
              ${pt($) && pt(f) ? 'eleitas' : 'eleitos'} para o Senado.`,
          });
      }
    }
  });
}

export function registrarMudancas(t, n, s, a, r, u) {
  const c = [];
  (Sim.UFS.forEach((l, d) => {
    const $ = t.uf[l],
      f = s.ups[d],
      m = r[d];
    if ($) {
      if ((m > 0 && !(f > 0) && c.push(l), m >= 1 && f < 1)) {
        const h = $.cand.map((w, z) => [w, z]).sort((w, z) => z[0] - w[0]),
          g = $.valid || 1,
          v = lt[h[0][1]],
          M = h[0][0] / g,
          S = lt[h[1][1]],
          x = h[1][0] / g;
        to({
          t: t.t,
          shown: n,
          uf: l,
          office: 'pres',
          cand: v,
          kind: 'apurado',
          line: () =>
            html`${Te[l]}: todas as seções totalizadas, ${Un(v)} com ${_t(M)}% e
            ${Un(S)} com ${_t(x)}%.`,
        });
      }
      if (a) {
        const h = a.uld[d],
          g = s.uld[d];
        if (
          h >= 0 &&
          g >= 0 &&
          h !== g &&
          u[d] === g &&
          s.ups[d] >= 0.1 &&
          !(s.tt - (dr[l] != null ? dr[l] : -1e9) < 10)
        ) {
          dr[l] = s.tt;
          const v = lt[g],
            M = lt[h];
          to({
            t: s.t,
            shown: s.tt,
            uf: l,
            office: 'pres',
            cand: v,
            flip: M,
            line: () =>
              html`${Te[l]}: ${Un(v)} passa à frente de ${yt(M)} para
              presidente.`,
          });
        }
      }
    }
  }),
    c.length &&
      to(
        We(
          Fe(
            {
              t: t.t,
              shown: n,
              office: 'pres',
              kind: 'first',
            },
            c.length === 1
              ? {
                  uf: c[0],
                }
              : {},
          ),
          {
            line: () =>
              c.length > 3
                ? html`Primeiros votos para presidente em ${c.length} estados.`
                : html`Primeiros votos para presidente ${pr(c.map(ct))}.`,
          },
        ),
      ));
}

export function registrarCapitais(t, n) {
  for (const c of Or)
    if (!ai.has(c) && Mo.done[c] <= t.t) {
      ai.add(c);
      const l = Mo.done[c],
        d = t.muni && Dt(t, c) >= 1 ? lt[pe(t, c)] : null,
        $ = d ? y(t, c) : 0,
        f = Geo.munis[c];
      l > -1 / 0 &&
        d &&
        to({
          t: l,
          shown: Math.max(l, Feed.LIVE ? n : l),
          uf: f.uf,
          office: 'pres',
          cand: d,
          kind: 'capital',
          line: () =>
            f.name === Te[f.uf]
              ? html`${Te[f.uf]}: capital apurada, ${Un(d)} vence por ${Oa($)}.`
              : html`${Te[f.uf]}: ${f.name} apurada, ${Un(d)} vence na capital
                por ${Oa($)}.`,
        });
    }
}
