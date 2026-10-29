import { Kn, p, sa, Pt, Ks } from './apuracao-e-votos-1.js';
import {
  us,
  useRef,
  pt,
  useState,
  useEffect,
  ge,
  nt,
  yt,
  _t,
  html,
  kt,
  useMemo,
  Xt,
  Ne,
} from './formatacao-e-acessibilidade-1.js';
import { qn, Ia, tn, Ao, Bo } from './contagem-e-animacao-1.js';
import { To, Cu, an, gr } from './candidatos-e-partidos-1.js';
import { Ho } from './hud-e-comunicacao-1.js';
import { Sim } from '../simulation.js';
export let ka, Tl, Ll, uc, o1, Ua, ja;
export function initialize() {
  initializeRowConfiguration();
  initializeResultRow();
  initializePaginatedResults();
  initializeStatusConfiguration();
  initializeStatusSummary();
}

function initializeRowConfiguration() {
  ka = (t, e) =>
    t
      ? {
          onMouseEnter: () => t.hover(e),
          onMouseLeave: () => t.hover(null),
          onFocus: () => t.hover(e),
          onBlur: () => t.hover(null),
        }
      : {};
  Tl = 78;
}

function initializeResultRow() {
  Ll = ({ r: t, office: e, onPick: n, link: s = null }) => {
    const a = Kn(t, e),
      r = p(t, e),
      [u, i] = r[0].votes >= r[1].votes ? r : [r[1], r[0]],
      c = us(u.share, i.share),
      l = sa(t, e),
      d = e === 'sen' ? l === 'eleitos' : l === 'eleito',
      $ = t.pst <= 0,
      f = useRef(null),
      m = resultStatusLabel($, l, d, u),
      h = u.id,
      g = useRef(h),
      [v, M] = useState(null);
    (useEffect(() => {
      if (g.current !== h && qn.on && !ge) {
        M(nt(u));
        const x = setTimeout(() => M(null), 1300);
        return ((g.current = h), () => clearTimeout(x));
      }
      g.current = h;
    }, [h]),
      Ia(f, [h]));
    const S = $
      ? 'aguardando as primeiras seções'
      : `${yt(u)} ${_t(u.share, c)}%, ${yt(i)} ${_t(i.share, c)}%${m ? ', ' + m : ''}`;
    return $
      ? html`<button
          class="rl wait"
          data-k=${t.uf}
          style=${'--row:' + Tl + 'px'}
          onClick=${() => n(t.uf)}
          aria-label=${`${t.name}: ${S}, ${a.length} candidaturas`}
          aria-current=${s && s.open === t.uf ? 'true' : null}
          ...${ka(s, t.uf)}
        >
          <span class="rs"><${To} r=${t} office=${e} big /></span
          ><span class="rw"
            ><${Cu} list=${a} /><small
              >Aguardando as primeiras seções</small
            ></span
          >
        </button>`
      : html`<button
          class="rl"
          data-k=${t.uf}
          style=${'--row:' + Tl + 'px'}
          onClick=${() => n(t.uf)}
          aria-label=${`${t.name}: ${S}`}
          aria-current=${s && s.open === t.uf ? 'true' : null}
          ...${ka(s, t.uf)}
        >
          ${v ? html`<span class="wash" style=${'--c:' + v}></span>` : null}
          <span class="rs"
            ><${To}
              r=${t}
              office=${e}
              big
            />${m ? html`<span class="rst">${m}</span>` : $ ? null : html`<span class="rbar"><i style=${`width:${Math.round(t.pst * 100)}%`}></i></span>`}</span
          >
          <span class="rp" ref=${f}
            >${[u, i].map((x, w) => html`<span class=${'rc' + (d && w ? ' lost' : '')} data-k=${x.id} key=${x.id}><${an} c=${x} size=${28} round /><span class="nm">${yt(x)}</span><b class="tn" style=${'color:' + kt(x)}>${$ ? null : html`<${tn} n=${x.share} fmt=${(z) => _t(z, c) + '%'} />`}</b></span>`)}</span
          >
        </button>`;
  };
}

function initializePaginatedResults() {
  uc = ({ m: t, office: e, onPick: n, title: s, link: a = null }) => {
    const [r, u] = Ao(),
      [i, c] = useState(0),
      [l, d] = useState(null),
      $ = useRef(null);
    let f = Pt(t, e);
    l && (f = f.slice().sort((w, z) => l.indexOf(w.uf) - l.indexOf(z.uf)));
    const m = Math.max(1, Math.floor(u.h / Tl)),
      h = Math.max(1, Math.ceil(f.length / m)),
      g = Math.min(i, h - 1),
      v = f.slice(g * m, g * m + m);
    Ia($, [v.map((w) => w.uf).join()]);
    const M = () => d(f.map((w) => w.uf)),
      S = () => d(null),
      x = useMemo(
        () => (w) => {
          (r(w), ($.current = w));
        },
        [],
      );
    return html`<div
      class=${'rlist' + (u.h && u.h < Tl * 0.9 ? ' empty' : '')}
      onPointerEnter=${(w) => w.pointerType === 'mouse' && M()}
      onPointerLeave=${(w) => w.pointerType === 'mouse' && S()}
      onfocusin=${M}
      onfocusout=${(w) => {
        w.currentTarget.contains(w.relatedTarget) || S();
      }}
    >
      <div class="lh">
        <h3>${s}</h3>
        <div class="pager tvhide">
          <button
            class="icon"
            aria-label="Anteriores"
            disabled=${g === 0}
            onClick=${() => c(g - 1)}
          >
            <${Ho} d=${-1} /></button
          ><span>${g + 1}/${h}</span
          ><button
            class="icon"
            aria-label="Próximas"
            disabled=${g >= h - 1}
            onClick=${() => c(g + 1)}
          >
            <${Ho} d=${1} />
          </button>
        </div>
      </div>
      <div class="rows" ref=${x}>
        ${u.h ? v.map((w) => html`<${Ll} key=${w.uf} r=${w} office=${e} onPick=${n} link=${a} />`) : null}
      </div>
    </div>`;
  };
}

function initializeStatusConfiguration() {
  o1 = {
    gov: [
      ['eleito', 'eleitos'],
      ['segundo-turno', 'no 2º turno'],
      ['apurando', 'em apuração'],
    ],
    sen: [
      ['eleitos', 'com as duas vagas'],
      ['um-eleito', 'com uma vaga'],
      ['apurando', 'em apuração'],
    ],
  };
}

function initializeStatusSummary() {
  Ua = ({ m: t, office: e, onPick: n, link: s = null }) => {
    const a = useRef(null),
      [r, u] = useState(null),
      i = o1[e].map(([f, m]) => ({
        st: f,
        label: m,
        list: Sim.UFS.map((h) => t.ufs[h])
          .filter((h) => sa(h, e) === f)
          .sort((h, g) => g.el - h.el),
      }));
    let c = i.flatMap((f) => f.list);
    (r && (c = c.slice().sort((f, m) => r.indexOf(f.uf) - r.indexOf(m.uf))),
      Ia(a, [c.map((f) => f.uf + sa(f, e)).join()]));
    const l = i[0].list.length + i[1].list.length > 0,
      d =
        Xt === 2
          ? Sim.UFS.filter((f) => !Ne.has(f) && !Ks(t.ufs[f], e)).length
          : 0,
      $ = (f) =>
        f.list.length === 1 && f.st === 'eleito'
          ? pt(Kn(f.list[0], e)[0])
            ? 'eleita'
            : 'eleito'
          : f.label;
    return html`<div class="tally">
      <p class="tline">
        ${
          l
            ? i
                .filter((f) => f.list.length)
                .map(
                  (f, m, h) =>
                    html`<span key=${f.st}
                      ><b class="tn"><${Bo} v=${String(f.list.length)} /></b
                      >${$(f)}${m < h.length - 1 ? html`<span class="dot">·</span>` : null}</span
                    >`,
                )
            : html`<span>Nenhum resultado definido ainda</span>`
        }
      </p>
      ${
        d > 0
          ? html`<p class="tline t1n">
              <span
                ><b class="tn">${d}</b>${d === 1 ? 'definido' : 'definidos'} no
                1º turno</span
              >
            </p>`
          : null
      }
      <div
        class="strip"
        ref=${a}
        onPointerEnter=${(f) => f.pointerType === 'mouse' && u(c.map((m) => m.uf))}
        onPointerLeave=${(f) => f.pointerType === 'mouse' && u(null)}
      >
        ${c.map((f) => {
          const m = Kn(f, e)[0],
            [h, g] = gr(f, e);
          return html`<button
            key=${f.uf}
            data-k=${f.uf}
            class="tile"
            style=${`--bg:${h};--fg:${g}`}
            onClick=${() => n(f.uf)}
            aria-current=${s && s.open === f.uf ? 'true' : null}
            ...${ka(s, f.uf)}
            aria-label=${f.pst > 0 ? `${f.name}, ${yt(m)} ${_t(m.share)}%` : `${f.name}, aguardando`}
          >
            ${f.uf}
          </button>`;
        })}
      </div>
    </div>`;
  };
  ja = (window.SENADO && window.SENADO.ficam) || {};
}

function resultStatusLabel(waiting, status, elected, candidate) {
  if (waiting) return null;
  if (status === 'segundo-turno') return '2º turno';
  if (!elected) return null;
  return pt(candidate) ? 'eleita' : 'eleito';
}
