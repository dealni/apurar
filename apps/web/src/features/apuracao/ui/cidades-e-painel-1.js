import {
  useRef,
  html,
  Pe,
  kt,
  Ee,
  Dt,
  G,
  mt,
  useState,
  useMemo,
  ht,
} from './formatacao-e-acessibilidade-1.js';
import { Kn, tt, ae } from './apuracao-e-votos-1.js';
import { To, an, vr } from './candidatos-e-partidos-1.js';
import { Geo } from '../geography.js';
import { jr, _c } from './atualizacoes-1.js';
import { Sim } from '../simulation.js';
import { zt } from './municipios-e-distritos-2.js';
import { So, Be } from './hud-e-comunicacao-1.js';
export let hd, md, vd, Nc, gd, bd;
function inicializarPainelDeslizante() {
  hd = ({ full: t, setFull: e, onClose: n, peek: s, children: a }) => {
    const r = useRef(null),
      u = useRef(null),
      i = (d, $ = !1) => {
        if (d.button > 0) return;
        const f = r.current;
        u.current = {
          y: d.clientY,
          h: f ? f.getBoundingClientRect().height : 0,
          full: t,
          moved: !1,
          body: $,
        };
        try {
          d.currentTarget.setPointerCapture(d.pointerId);
        } catch {
          /* Fallback opcional preservado da captura; a interface continua disponível. */
        }
      },
      c = (d) => {
        const $ = u.current,
          f = r.current;
        if (!$ || !f) return;
        const m = d.clientY - $.y;
        (Math.abs(m) > 4 && ($.moved = !0),
          (f.style.transition = 'none'),
          (f.style.transform = `translateY(${Math.max(0, ($.full ? 0 : $.h - s) + m)}px)`));
      },
      l = (d) => {
        const $ = u.current,
          f = r.current;
        if (!$) return;
        ((u.current = null),
          f && ((f.style.transition = ''), (f.style.transform = '')));
        const m = d.clientY - $.y;
        if (!$.moved) {
          $.body || e(!t);
          return;
        }
        m < -50 ? e(!0) : m > 50 && ($.full ? e(!1) : n());
      };
    return html`<div
      class=${'bsheet' + (t ? ' full' : '')}
      ref=${r}
      style=${`--peek:${s}px`}
    >
      <div
        class="bs-grip"
        onPointerDown=${i}
        onPointerMove=${c}
        onPointerUp=${l}
        onPointerCancel=${l}
        aria-label=${t ? 'Recolher' : 'Abrir inteiro'}
        role="button"
        tabindex="0"
        onKeyDown=${(d) => {
          (d.key === 'Enter' || d.key === ' ') && (d.preventDefault(), e(!t));
        }}
      >
        <i></i>
      </div>
      <div
        class=${'bs-body' + (t ? ' scroll' : ' grab')}
        onPointerDown=${t ? null : (d) => i(d, !0)}
        onPointerMove=${t ? null : c}
        onPointerUp=${t ? null : l}
        onPointerCancel=${t ? null : l}
      >
        ${a}
      </div>
    </div>`;
  };
}

function inicializarLinhasDeMunicipios() {
  md = ({ r: t, onPick: e }) => {
    const n = Kn(t, 'pres'),
      s = n[0],
      a = t.pst > 0 && !!s && s.votes > 0;
    return html`<button class="krow prow" onClick=${() => e(t.uf)}>
      <${To} r=${t} office="pres" /><span class="kn"
        ><span class="nm">${t.name}</span
        ><small class="tn"
          >${a ? Pe(t.pst) + '% das seções' : 'aguardando'}</small
        ></span
      >
      <span class="kv"
        >${a ? html`<${an} c=${s} size=${24} round /><b class="tn" style=${'color:' + kt(s)}>${Ee(s.share)}</b>` : html`<small>–</small>`}</span
      >
    </button>`;
  };
  vd = tt
    .slice()
    .sort((t, e) => ae[e] - ae[t])
    .slice(0, 20);
  Nc = ({ m: t, i: e, onTown: n }) => {
    const s = Geo.munis[e],
      a = Dt(t, e),
      r = a > 0 ? (G(t, e) || [])[0] : null,
      u = !!r && r.votes > 0;
    return html`<button class="krow prow" onClick=${() => n(e)}>
      <${To} r=${t.ufs[s.uf]} office="pres" plain /><span class="kn"
        ><span class="nm">${s.name}</span
        ><small class="tn">${s.uf} · ${mt(ae[e])}</small></span
      >
      <span class="kv"
        >${u ? html`<${an} c=${r} size=${24} round /><b class="tn" style=${'color:' + kt(r)}>${Ee(r.share)}</b>` : html`<small>–</small>`}</span
      >
    </button>`;
  };
}

function inicializarBuscaDeMunicipios() {
  gd = ({ m: t, uf: e, onTown: n }) => {
    const [s, a] = useState(''),
      [r, u] = useState(20),
      i = useMemo(
        () =>
          tt.filter(($) => Geo.munis[$].uf === e).sort(($, f) => ae[f] - ae[$]),
        [e],
      ),
      c = ($) =>
        $.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase(),
      l = c(s.trim()),
      d = l ? i.filter(($) => c(Geo.munis[$].name).includes(l)) : i;
    return html`<section class="card enter tlist">
      <div class="hd">
        <h3>Cidades</h3>
        <span class="aside tn">${ht(i.length)} municípios</span>
      </div>
      ${
        i.length > 20
          ? html`<div class="dfilt bfind">
              <input
                type="search"
                value=${s}
                placeholder=${'Buscar entre ' + ht(i.length) + ' municípios'}
                aria-label="Buscar um município pelo nome"
                onInput=${($) => {
                  (a($.target.value), u(20));
                }}
              />
            </div>`
          : null
      }
      <div class="plist">
        ${d.slice(0, r).map(($) => html`<${Nc} key=${'t' + $} m=${t} i=${$} onTown=${n} />`)}
      </div>
      ${d.length > r ? html`<button type="button" class="dmore" onClick=${() => u(($) => $ + 50)}>Mostrar mais ${ht(Math.min(50, d.length - r))} · faltam ${ht(d.length - r)}</button>` : null}
    </section>`;
  };
}

function inicializarExploracaoGeografica() {
  bd = ({ m: t, onSearch: e, onState: n, onTown: s, onAbroad: a }) => {
    const r = jr(),
      u = r.list(),
      i = t.ufs.ZZ,
      c = i ? Kn(i, 'pres') : [],
      l = c[0];
    return html`<div class="sh-pane" key="exp">
      <button class="sh-find" onClick=${e}>
        <${vr} /><span>Estado, cidade, bairro ou candidato</span>
      </button>
      ${
        u.length
          ? html`<section class="card enter">
              <div class="hd"><h3>Minhas cidades</h3></div>
              ${u.map((d) => html`<${_c} key=${'f' + d} m=${t} i=${d} onTown=${s} />`)}
            </section>`
          : null
      }
      <section class="card enter">
        <div class="hd"><h3>Estados</h3></div>
        <div class="plist">
          ${Sim.UFS.map((d) => t.ufs[d])
            .filter(Boolean)
            .sort((d, $) => d.name.localeCompare($.name))
            .map((d) => html`<${md} key=${d.uf} r=${d} onPick=${n} />`)}
        </div>
      </section>
      <section class="card enter">
        <div class="hd"><h3>Maiores cidades</h3></div>
        <div class="plist">
          ${vd.map((d) => html`<${Nc} key=${'b' + d} m=${t} i=${d} onTown=${s} />`)}
        </div>
      </section>
      ${
        zt && i
          ? html`<section class="card enter">
              <button class="krow prow" onClick=${a}>
                <span class="uft plain zt"><${So} size=${14} /></span
                ><span class="kn"
                  ><span class="nm">Exterior</span
                  ><small class="tn"
                    >${mt(i.el)} em ${zt.cities.length} cidades</small
                  ></span
                ><span class="kv"
                  >${i.pst > 0 && l && l.votes > 0 ? html`<${an} c=${l} size=${24} round /><b class="tn" style=${'color:' + kt(l)}>${Ee(l.share)}</b>` : html`<small>–</small>`}</span
                >
              </button>
            </section>`
          : null
      }
    </div>`;
  };
}

export function initialize() {
  inicializarPainelDeslizante();
  inicializarLinhasDeMunicipios();
  inicializarBuscaDeMunicipios();
  inicializarExploracaoGeografica();
}
