import { Feed } from '../feed.js';
import { Uc } from './estado-e-navegacao-1.js';
import {
  Xt,
  jt,
  lt,
  html,
  Pe,
  mt,
  Te,
  yt,
  _t,
  Ee,
  useState,
  ht,
  nt,
  kt,
  Nt,
} from './formatacao-e-acessibilidade-1.js';
import { We, Fe } from '../object-helpers.js';
import { os, To, an } from './candidatos-e-partidos-1.js';
import { No, iu, Xn, Ie, Co, Nn, cr } from './apuracao-e-votos-1.js';
import { Sim } from '../simulation.js';
import { zt } from './municipios-e-distritos-2.js';
import { Bl } from './resultados-municipais-1.js';
import { So } from './hud-e-comunicacao-1.js';
import { tn } from './contagem-e-animacao-1.js';
import { Geo } from '../geography.js';
export let Ka, Sc, C1, Ur, Dl;
export function initialize() {
  initializeRegionalConfiguration();
  initializeRegionalDetail();
  initializeRegionalOverview();
  initializeFavoriteCities();
}

function initializeRegionalConfiguration() {
  Ka = (t, e) =>
    !e &&
    !!t &&
    !!t.n &&
    (Feed.LIVE
      ? Uc && (Xt === 2 || t.n.status === 'segundo-turno')
      : Xt === 2 && !!window.PREVISAO);
  Sc = [
    ['N', 'Norte'],
    ['NE', 'Nordeste'],
    ['CO', 'Centro-Oeste'],
    ['SE', 'Sudeste'],
    ['S', 'Sul'],
  ];
}

function initializeRegionalDetail() {
  C1 = ({ x: t, m: e, onBack: n, onState: s }) => {
    const a = jt(
        lt.map((u, i) =>
          We(Fe({}, u), {
            k: i,
            votes: t.cand[i],
          }),
        ),
        t.valid,
      ),
      r = a.filter((u) => u.votes > 0).slice(0, Xt === 2 ? 2 : 4);
    return html`<section class="card regc rdet enter">
      <div class="hd">
        <button class="lnk" type="button" onClick=${n}>‹ Por região</button
        ><span class="aside tn"
          >${t.pst > 0 ? Pe(t.pst) + '% das seções' : 'aguardando'}</span
        >
      </div>
      <div class="rdh">
        <h3>${t.nm}</h3>
        <span class="tn"
          >${t.pst <= 0 ? '' : t.left > 0 ? 'faltam ' + mt(t.left) : 'apuração concluída'}</span
        >
      </div>
      ${r.length ? r.map((u) => html`<${os} key=${u.id} c=${u} size=${28} bar votes />`) : html`<p class="note">Nenhuma seção apurada ainda.</p>`}
      ${t.w22 && r.length ? html`<${No} w=${t.w22} />` : null}
      <div class="rufs">
        ${t.ufs.map((u) => {
          const i = e.ufs[u],
            c = i.pres[0];
          return html`<button
            type="button"
            class="ruf"
            key=${u}
            onClick=${() => s && s(u)}
            aria-label=${`${Te[u]}: ${i.pst > 0 ? Pe(i.pst) + '% das seções' + (c ? `, ${yt(c)} ${_t(c.share)}%` : '') : 'aguardando'}`}
          >
            <${To} r=${i} office="pres" /><span class="tn"
              >${i.pst > 0 && c ? Ee(c.share) : '–'}</span
            >
          </button>`;
        })}
      </div>
    </section>`;
  };
}

function initializeRegionalOverview() {
  Ur = ({ m: t, onAbroad: e = null, onState: n = null }) => {
    const [s, a] = useState(null),
      r = Sc.map(([l, d]) => {
        const $ = Sim.UFS.filter((S) => Sim.REGION[S] === l),
          f = lt.map(() => 0);
        let m = 0,
          h = 0,
          g = 0,
          v = 0;
        for (const S of $) {
          const x = t.ufs[S];
          ((m += x.valid),
            x.pres.forEach((w) => (f[w.k] += w.votes)),
            (h += x.secDone),
            (g += x.sections),
            (v += x.left));
        }
        const M = f.indexOf(Math.max(...f));
        return {
          r: l,
          nm: d,
          ufs: $,
          cand: f,
          valid: m,
          pst: g ? h / g : 0,
          left: v,
          lead: We(Fe({}, lt[M]), {
            k: M,
            share: m ? f[M] / m : 0,
          }),
          w22: iu($),
        };
      }),
      u = t.ufs.ZZ;
    zt &&
      u &&
      r.push({
        r: 'ZZ',
        nm: 'Exterior',
        pst: u.pst,
        left: u.left,
        lead: u.pres[0],
        w22: Xn && Ie.uf.ZZ ? Co(Ie.uf.ZZ) : null,
      });
    const i = (l) =>
        l.pst > 0 &&
        l.w22 &&
        (l.lead.partido === 'PT' || l.lead.partido === 'PL')
          ? l.lead.share - l.w22[l.lead.partido === 'PT' ? 0 : 1]
          : null,
      c = s && r.find((l) => l.r === s);
    return c
      ? html`<${C1}
          key=${'rd' + s}
          x=${c}
          m=${t}
          onBack=${() => a(null)}
          onState=${n}
        />`
      : html`<section class="card regc xmid enter">
          <div class="hd"><h3>Por região</h3></div>
          ${r.map(
            (l) =>
              html`<${l.r !== 'ZZ' || e ? 'button' : 'div'}
                class=${'reg' + (l.r === 'ZZ' ? ' zz' : '')}
                key=${l.r}
                onClick=${l.r === 'ZZ' ? e : () => a(l.r)}
                aria-label=${l.r === 'ZZ' ? `Exterior: ${l.pst > 0 ? `${yt(l.lead)} ${_t(l.lead.share)}%, ${Pe(l.pst)}% das seções` : `urnas fechadas em ${ht(Bl(t.t).n)} de ${ht(Nn.length)} cidades`}` : null}
                ><div>
                  <div class="nm">
                    ${l.r === 'ZZ' ? html`<${So} size=${12} /> ` : null}${l.nm}
                  </div>
                  <div class="p tn">
                    ${
                      l.r === 'ZZ' && l.pst <= 0
                        ? (() => {
                            const d = Bl(t.t);
                            return `urnas fechadas em ${ht(d.n)} de ${ht(d.total)} cidades`;
                          })()
                        : html`${Pe(l.pst)}% apurado`
                    }
                  </div>
                </div>
                <div class="bar" style="--h:3px">
                  <div class="clip">
                    ${l.pst > 0 ? html`<i key="v" style=${`flex-grow:${l.lead.share};background:${nt(l.lead)}`}></i><i key="r" style=${`flex-grow:${1 - l.lead.share};background:rgba(250,250,249,.10)`}></i>` : null}
                  </div>
                  <span class="fifty"></span>
                </div>
                <div class="ld">
                  ${l.pst > 0 ? html`<${an} c=${l.lead} size=${26} round /><span class="pm" style=${'color:' + kt(l.lead)}>${Nt(l.lead)}</span><span class="tn"><${tn} n=${l.lead.share} fmt=${Ee} /></span>${i(l) != null ? html`<small class="d22 tn" title=${`Em relação a 2022 (${l.lead.partido === 'PT' ? 'Lula' : 'Jair Bolsonaro, então no PL'}), em pontos`}>${cr(i(l))}</small>` : null}` : null}
                </div><//
              >`,
          )}
        </section>`;
  };
}

function initializeFavoriteCities() {
  Dl = (() => {
    const t = 'apuracao-cidades',
      e = new Set(),
      n = new Map(Geo.munis.map((r, u) => [String(r.id), u]));
    let s = [];
    try {
      const r = JSON.parse(localStorage.getItem(t) || '[]');
      Array.isArray(r) &&
        (s = r
          .map(String)
          .filter((u) => n.has(u))
          .slice(0, 12));
    } catch {
      /* Fallback opcional preservado da captura; a interface continua disponível. */
    }
    const a = () => {
      try {
        localStorage.setItem(t, JSON.stringify(s));
      } catch {
        /* Fallback opcional preservado da captura; a interface continua disponível. */
      }
      e.forEach((r) => r());
    };
    return {
      list: () => s.map((r) => n.get(r)),
      has: (r) => s.includes(String(Geo.munis[r].id)),
      toggle: (r) => {
        const u = String(Geo.munis[r].id);
        ((s = s.includes(u)
          ? s.filter((i) => i !== u)
          : [u, ...s].slice(0, 12)),
          a());
      },
      on: (r) => (e.add(r), () => e.delete(r)),
    };
  })();
}
