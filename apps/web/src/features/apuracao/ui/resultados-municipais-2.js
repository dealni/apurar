import {
  Cs,
  $a,
  Vo,
  bn,
  so,
  aa,
  ha,
  No,
  ol,
  Pt,
} from './apuracao-e-votos-1.js';
import {
  useRef,
  wn,
  html,
  un,
  mt,
  vt,
  ht,
  Xt,
  Ne,
} from './formatacao-e-acessibilidade-1.js';
import { Ao, tn } from './contagem-e-animacao-1.js';
import { zt } from './municipios-e-distritos-2.js';
import { Xo, R1, Ma } from './resultados-municipais-1.js';
import { mo } from './hud-e-comunicacao-1.js';
import { Lo, os } from './candidatos-e-partidos-1.js';
import { Ua, uc } from './resultados-e-listas-1.js';
import { Pl } from './composicao-legislativa-1.js';
export let D1, V1, N1, q1;
export function initialize() {
  D1 = PainelPaisExterior;
  V1 = PainelCidadeExterior;
  N1 = PainelGovernadores;
  q1 = PainelSenado;
}
function PainelPaisExterior({
  m: t,
  iso: e,
  onCity: n,
  onUp: s,
  onClose: a,
  scroll: r = !1,
}) {
  const u = Cs(e),
    i = useRef(null),
    [c, l] = Ao();
  if ((wn(i, e), !u)) return null;
  const { race: d, pst: $ } = $a(t, u),
    f = u.cities.slice().sort((h, g) => zt.cities[g].el - zt.cities[h].el),
    m = Math.max(2, Math.floor((l.h || Xo * 3) / Xo));
  return renderCartaoPaisExterior(r, e, s, i, u, $, a, d, t, f, c, l, m, n);
}
function PainelCidadeExterior({
  m: t,
  i: e,
  onUp: n,
  onClose: s,
  tv: a = !1,
  scroll: r = !1,
  spot: u = null,
}) {
  const i = zt.cities[e],
    c = Vo(t, e),
    l = bn(t, e),
    d = so(t, e) || [],
    $ = useRef(null),
    f = Cs(i.iso),
    m = f && f.cities.length > 1 ? i.country : 'Exterior';
  return (
    wn($, 'x' + e),
    renderCartaoCidadeExterior(a, r, e, n, m, i, $, c, s, l, t, d, u)
  );
}
function PainelGovernadores({ m: t, onPick: e, link: n }) {
  return html`<section class="card grow enter">
    <div class="hd">
      <h3>Governadores</h3>
      <span class="aside"
        >${Xt === 2 ? `2º turno em ${Ne.size} ${Ne.size === 1 ? 'estado' : 'estados'}` : '27 disputas'}</span
      >
    </div>
    <${Ua} m=${t} office="gov" onPick=${e} link=${n} />${
      Pt(t, 'gov').length
        ? html`<div class="sep"></div>
            <${uc}
              m=${t}
              office="gov"
              onPick=${e}
              link=${n}
              title="Disputas, das mais apertadas"
            />`
        : null
    }
  </section>`;
}
function PainelSenado({ m: t, onPick: e, link: n }) {
  return html`<section class="card grow enter">
    <div class="hd">
      <h3>Senado</h3>
      <span class="aside">Duas vagas por estado</span>
    </div>
    <${Pl} m=${t} />
    <div class="sep"></div>
    <${Ua} m=${t} office="sen" onPick=${e} link=${n} />
    <div class="sep"></div>
    <${uc}
      m=${t}
      office="sen"
      onPick=${e}
      link=${n}
      title="A disputa pela 2ª vaga"
    />
  </section>`;
}
function renderCartaoPaisExterior(r, e, s, i, u, $, a, d, t, f, c, l, m, n) {
  return html`<section
    class=${'card grow stc ext enter' + (r ? ' pcard scroll' : '')}
    key=${'k' + e}
  >
    <button
      class="upto tvhide"
      onClick=${s}
      aria-label="Voltar para o exterior"
    >
      ‹ Exterior
    </button>
    <div class="sh">
      <span class="uft big plain">${e}</span>
      <div>
        <h2 tabindex="-1" ref=${i}>${u.name}</h2>
        <div class="sub sub2 tn">
          <span><${tn} n=${$} fmt=${un} /> das seções</span
          ><span>${mt(u.el)}</span>
        </div>
      </div>
      <div class="x tvhide">
        <button class="icon" aria-label="Fechar o país" onClick=${a}>
          <${mo} />
        </button>
      </div>
    </div>
    <section>
      <div class="lab">
        <span>Presidente</span
        >${$ >= 1 ? html`<${Lo} status="apurado" />` : null}
      </div>
      ${$ > 0 && d[0] && d[0].votes > 0 ? d.slice(0, 3).map((h) => html`<${os} key=${h.id} c=${h} size=${30} />`) : html`<p class="note">${$ > 0 ? (t.live && vt.on ? 'Revendo a noite, os votos por cidade só existem para agora.' : 'Carregando…') : 'Nenhuma seção totalizada ainda.'}</p>`}
    </section>
    <section class="kgrow">
      <div class="lab">
        <span>${f.length > 1 ? 'Cidades' : 'Onde se vota'}</span>
      </div>
      <div class="klist" ref=${c}>
        ${l.h || r ? f.slice(0, r ? 12 : m).map((h) => html`<${R1} key=${h} m=${t} i=${h} onPick=${n} />`) : null}
      </div>
    </section>
  </section>`;
}
function renderCartaoCidadeExterior(a, r, e, n, m, i, $, c, s, l, t, d, u) {
  return html`<section
    class=${'card grow stc ext enter' + (a ? ' big' : '') + (r ? ' pcard scroll' : '')}
    key=${'x' + e}
  >
    <button class="upto tvhide" onClick=${n} aria-label=${'Voltar para ' + m}>
      ‹ ${m}
    </button>
    <div class="sh">
      <span class="uft big plain">${i.iso}</span>
      <div>
        <h2 tabindex="-1" ref=${$}>${i.name}</h2>
        <div class="sub sub2 tn">
          <span>${i.country}</span><span>${mt(c ? c.el : i.el)}</span>
        </div>
      </div>
      <div class="x tvhide">
        <button class="icon" aria-label="Fechar a cidade" onClick=${s}>
          <${mo} />
        </button>
      </div>
    </div>
    <section>
      <div class="lab">
        <span>Presidente</span
        >${l >= 1 ? html`<${Lo} status="apurado" />` : l <= 0 ? html`<${Lo} status="apurando" pst=${0} />` : null}
      </div>
      <p class="note tn">
        As urnas ${i.closes <= t.t ? 'fecharam' : 'fecham'} às ${Ma(i.closes)},
        no horário de
        Brasília${c ? html` · <${tn} n=${c.done} fmt=${ht} /> de ${ht(c.sections)} ${c.sections === 1 ? 'seção' : 'seções'}` : ''}
      </p>
      ${l > 0 ? d.slice(0, 4).map((h) => html`<${os} key=${h.id} c=${h} size=${30} bar votes cls=${u && u.office === 'pres' && u.id === h.id ? 'spot' : ''} />`) : null}
      ${Xt === 2 ? html`<${aa} s=${ha('ZZ', null, e)} />` : null}<${No}
        w=${ol[e]}
      />
    </section>
  </section>`;
}
