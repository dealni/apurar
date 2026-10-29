import {
  useState,
  useEffect,
  html,
  Dt,
  lt,
  pe,
  Ee,
  y,
  ue,
  Pe,
  yt,
  kt,
  nt,
  useRef,
  ie,
  vt,
  useLayoutEffect,
  hn,
  Oe,
  ht,
} from './formatacao-e-acessibilidade-1.js';
import { Dl } from './regioes-1.js';
import { Geo } from '../geography.js';
import { an } from './candidatos-e-partidos-1.js';
import { ho, Ia, tn, Bo } from './contagem-e-animacao-1.js';
import { Feed } from '../feed.js';
import { Is } from './eventos-e-progresso-1.js';
import { ka } from './resultados-e-listas-1.js';
export let jr, M1, xc, Ec, _c, Hs, zc, A1, S1, x1, Gr, Tc, Vl, Lc;
export function initialize() {
  jr = shelljr;
  M1 = shellM1;
  xc = shellxc;
  Ec = shellEc;
  _c = shell_c;
  Hs = shellHs;
  zc = shellzc;
  A1 = {
    urna: () =>
      html`<path d="M3 8.5h3M10 8.5h3v5H3v-5" /><path
          d="M6.2 9.6V2.8h3.6v6.8"
        /><path d="M7 5.8l.8.8 1.3-1.5" />`,
    swap: () =>
      html`<path d="M3 5.5h9.5M10.3 3.3l2.2 2.2-2.2 2.2" /><path
          d="M13 10.5H3.5M5.7 8.3l-2.2 2.2 2.2 2.2"
        />`,
    star: () =>
      html`<path
        class="fill"
        d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4-2.9-2.8 4-.6z"
      />`,
    check: () => html`<path d="M3.4 8.5l2.9 2.9 6.3-6.6" />`,
    pin: () =>
      html`<path
          d="M8 14s4.6-4.3 4.6-7.7A4.6 4.6 0 0 0 3.4 6.3C3.4 9.7 8 14 8 14z"
        /><circle cx="8" cy="6.3" r="1.6" />`,
    flag: () =>
      html`<path d="M4.2 13.8V2.5" /><path
          d="M4.2 3h7.6l-1.7 2.6 1.7 2.6H4.2"
        />`,
    globe: () =>
      html`<circle cx="8" cy="8" r="6" /><ellipse
          cx="8"
          cy="8"
          rx="2.6"
          ry="6"
        /><path d="M2 8h12" />`,
  };
  S1 = shellS1;
  x1 = shellx1;
  Gr = shellGr;
  Tc = shellTc;
  Vl = shellVl;
  Lc = shellLc;
}
function shelljr() {
  const [, t] = useState(0);
  return (useEffect(() => Dl.on(() => t((e) => e + 1)), []), Dl);
}
function shellM1({ on: t }) {
  return html`<svg
    width="15"
    height="15"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path
      d="M8 1.7l1.93 4.06 4.45.55-3.28 3.05.84 4.41L8 11.56 4.06 13.77l.84-4.41L1.62 6.31l4.45-.55z"
      fill=${t ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linejoin="round"
    />
  </svg>`;
}
function shellxc({ i: t }) {
  const e = jr(),
    n = e.has(t),
    s = n ? 'Tirar das minhas cidades' : 'Guardar nas minhas cidades';
  return html`<button
    class=${'icon fav' + (n ? ' on' : '')}
    aria-pressed=${n ? 'true' : 'false'}
    aria-label=${s}
    title=${s}
    onClick=${() => e.toggle(t)}
  >
    <${M1} on=${n} />
  </button>`;
}
function shellEc(t, e) {
  const n = Dt(t, e),
    s = n > 0 ? lt[pe(t, e)] : null;
  return s
    ? {
        A: s,
        v:
          lt.length === 2
            ? Ee(0.5 + y(t, e) / 2)
            : '+' + ue[1].format(y(t, e) * 100),
      }
    : null;
}
function shell_c({ m: t, i: e, onTown: n }) {
  const s = Geo.munis[e],
    a = Dt(t, e),
    r = Ec(t, e);
  return html`<button
    class="fv"
    onClick=${() => n && n(e)}
    aria-label=${`${s.name}, ${s.uf}: ${a > 0 ? `${Pe(a)}% das seções` : 'nenhuma seção apurada'}${r ? `, ${yt(r.A)} na frente` : ''}`}
  >
    <${zc} p=${a} /><span class="fvn"
      ><b>${s.name}</b
      ><span class="tn"
        >${s.uf}${a > 0 ? ` · ${Pe(a)}% apurado` : ' · aguardando'}</span
      ></span
    >
    ${r ? html`<${an} c=${r.A} size=${26} round /><b class="tn fvv" style=${'color:' + kt(r.A)}>${r.v}</b>` : null}
  </button>`;
}
function shellHs(t) {
  return 'e' + t.id;
}
function shellzc({ p: t, size: e = 24 }) {
  return html`<svg
    class="ring"
    width=${e}
    height=${e}
    viewBox="0 0 24 24"
    role="img"
    aria-label=${Math.round(t * 100) + '% das seções'}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="rgba(250,250,249,.16)"
      stroke-width="3"
    />
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="#FAFAF9"
      stroke-width="3"
      stroke-dasharray=${`${(t * 56.55).toFixed(2)} 56.55`}
      transform="rotate(-90 12 12)"
    />
  </svg>`;
}
function shellS1(t) {
  return t.big === 'virada' || t.flip
    ? 'swap'
    : t.big
      ? 'star'
      : t.ms != null
        ? 'urna'
        : t.uf === 'ZZ' || t.zz
          ? 'globe'
          : t.kind === 'capital'
            ? 'pin'
            : t.kind === 'apurado'
              ? 'check'
              : t.kind === 'first'
                ? 'flag'
                : t.office === 'gov' || t.office === 'sen'
                  ? 'star'
                  : 'urna';
}
function shellx1({ e: t }) {
  const e = S1(t),
    n = t.cand && e !== 'urna' && e !== 'flag' ? t.cand : null;
  return html`<span
    class=${'evi' + (n ? ' on' : '')}
    style=${n ? `--c:${nt(n)};--ct:${kt(n)}` : null}
    aria-hidden="true"
    ><svg width="16" height="16" viewBox="0 0 16 16">${A1[e]()}</svg></span
  >`;
}
function shellGr(t, e, n = Hs) {
  const s = useRef(null),
    a = useRef([]),
    r = useRef(e),
    u = useRef(0),
    [, i] = useState(0);
  if (
    (s.current == null && (s.current = new Set(t.map(n))),
    e < r.current || e - r.current > 20)
  )
    (t.forEach((c) => s.current.add(n(c))), (a.current = []));
  else {
    const c = t
      .filter((l) => !s.current.has(n(l)) && !a.current.includes(n(l)))
      .reverse()
      .map(n);
    if (c.length)
      for (a.current.push(...c); a.current.length > 6;)
        s.current.add(a.current.shift());
  }
  return (
    (r.current = e),
    useEffect(() => {
      if (!a.current.length || u.current) return;
      const c = () => {
        const l = a.current.shift();
        (l && (s.current.add(l), i((d) => d + 1)),
          (u.current = a.current.length
            ? setTimeout(c, ie(ho.dur / (a.current.length + 1), 700, 2400))
            : 0));
      };
      u.current = setTimeout(c, 0);
    }),
    useEffect(() => () => clearTimeout(u.current), []),
    t.filter((c) => s.current.has(n(c)))
  );
}
function shellTc({ t, link: e = null, m: n = null, onTown: s = null }) {
  const a = Feed.LIVE && !vt.on,
    r = Gr(
      Is.filter((h) => a || h.t <= t)
        .slice(-60)
        .reverse(),
      t,
    ),
    u = useRef(null),
    i = jr(),
    c = n ? i.list() : [],
    [l, d] = useState('ev'),
    $ = l === 'fav' && c.length > 0;
  Ia(u, [r.length ? Hs(r[0]) : '']);
  const f = () => {
    const h = u.current;
    h &&
      h.classList.toggle(
        'over',
        h.scrollHeight - h.scrollTop > h.clientHeight + 1,
      );
  };
  useLayoutEffect(f, [r.length, $]);
  const m = c.length
    ? html`<div class="seg2 ftabs" role="group" aria-label="Lista">
        <button
          type="button"
          aria-pressed=${$ ? 'false' : 'true'}
          onClick=${() => d('ev')}
        >
          Últimas atualizações</button
        ><button
          type="button"
          aria-pressed=${$ ? 'true' : 'false'}
          onClick=${() => d('fav')}
        >
          Minhas cidades <span class="tn">${c.length}</span>
        </button>
      </div>`
    : html`<h3>Últimas atualizações</h3>`;
  return html`<section class="card feedc enter">
    <div class="hd">${m}</div>
    ${$ ? html`<div class="feed favs">${c.map((h) => html`<${_c} key=${'f' + h} m=${n} i=${h} onTown=${s} />`)}</div>` : null}
    <div class="feed" ref=${u} onScroll=${f} hidden=${$}>
      ${
        r.length
          ? r.map((h) => {
              const g = html`<time>${hn(h.shown != null ? h.shown : h.t)}</time
                ><${x1} e=${h} />
                <p>${h.line()}</p>`;
              return h.uf && e
                ? html`<button
                    class="ev"
                    data-k=${Hs(h)}
                    key=${Hs(h)}
                    onClick=${() => e.go(h.office, h.uf)}
                    ...${ka(e, h.uf)}
                  >
                    ${g}
                  </button>`
                : html`<div class="ev" data-k=${Hs(h)} key=${Hs(h)}>${g}</div>`;
            })
          : html`<p class="f3" style="font:400 13px/1.4 var(--sans)">
              ${t < Oe ? 'Os primeiros números saem às 17:00.' : 'As novidades da apuração aparecem aqui assim que chegam.'}
            </p>`
      }
    </div>
  </section>`;
}
function shellVl({ list: t, none: e }) {
  const n = (t || []).filter((s) => s.anulado);
  return n.length
    ? html`<div class="nulled">
        ${n.map((s) => html`<div class="nl" key=${s.id}><${an} c=${s} size=${24} round /><span class="nm">${yt(s)}</span><span class="chip">${s.sj ? 'Sub judice' : 'Votos anulados'}</span>${e ? null : html`<b class="tn"><${tn} n=${s.votes} fmt=${ht} />${s.sj && s.share > 0 ? ' · ' + Ee(s.share) : ''}</b>`}</div>`)}
      </div>`
    : null;
}
function shellLc({ cells: t }) {
  return html`<div class="margin">
    ${t.map((e, n) => (e ? html`<div key=${n + e[0]}><span class="ml">${e[0]}</span><b class="tn">${e[2] ? html`<${tn} n=${e[1]} fmt=${e[2]} />` : html`<${Bo} v=${e[1]} />`}</b></div>` : html`<div key=${n}></div>`))}
  </div>`;
}
