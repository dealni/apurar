import { Geo } from '../geography.js';
import {
  it,
  Dt,
  G,
  useRef,
  U,
  Xt,
  wn,
  html,
  Te,
  mt,
  Pe,
  _t,
  ht,
  vt,
  Ee,
  Ne,
  J,
} from './formatacao-e-acessibilidade-1.js';
import { vn, wt, En, Qt } from './municipios-e-distritos-1.js';
import { $e } from './municipios-e-distritos-2.js';
import { hl, os, Lo } from './candidatos-e-partidos-1.js';
import { ae, aa, ha, Xn, No, ni } from './apuracao-e-votos-1.js';
import { xc } from './atualizacoes-1.js';
import { mo } from './hud-e-comunicacao-1.js';
import { tn } from './contagem-e-animacao-1.js';
import { Xs } from './paineis-e-projecoes-1.js';
import { T1, _1 } from './resultados-estaduais-2.js';
export let L1, vo;
export function initialize() {
  L1 = PainelMunicipioPresidencial;
  vo = {
    data: {},
    at: {},
    bad: {},
    subs: new Set(),
  };
}
function PainelMunicipioPresidencial({
  m: t,
  i: e,
  onClose: n,
  onState: s,
  scroll: a = !1,
  spot: r = null,
  tv: u = !1,
  zone: i = null,
  onZone: c = null,
  zlink: l = null,
  bairro: d = null,
  onBairro: $ = null,
}) {
  const f = Geo.munis[e],
    m = it(t, e),
    h = Dt(t, e),
    g = G(t, e) || [],
    v = useRef(null),
    M = !u && vn(t, e),
    S = !!U(e) && !M,
    x = selecionarZonaMunicipio(S, i, u, t, e),
    w = x ? x.rows[i] : null,
    z = candidatosComVotosZona(w),
    gt = u ? null : En(t, e),
    _ = !!gt,
    j = selecionarResultadoBairro(_, w, d, gt, t, e),
    Y = j ? j.list.filter((xt) => xt.votes > 0) : [],
    E =
      j && Xt === 2
        ? Qt(
            gt,
            gt.b.map((xt, Bt) => Bt).filter((xt) => gt.b[xt] === d),
          )
        : null,
    T = S || _ || M,
    Ct = T && !u ? 2 : 4;
  return (
    wn(v, e),
    renderCartaoMunicipio(
      a,
      e,
      s,
      f,
      v,
      m,
      n,
      w,
      i,
      c,
      z,
      j,
      d,
      gt,
      $,
      Y,
      E,
      h,
      t,
      g,
      Ct,
      r,
      T,
      _,
      S,
      l,
    )
  );
}
function selecionarZonaMunicipio(S, i, u, t, e) {
  return S && i != null && !u ? wt(t, e) : null;
}
function candidatosComVotosZona(w) {
  return w && w.race && w.f > 0 ? w.race.filter((xt) => xt.votes > 0) : [];
}
function selecionarResultadoBairro(_, w, d, gt, t, e) {
  return _ && !w && d != null && gt.bairros[d] != null ? $e(t, e, gt)[d] : null;
}
function renderCartaoMunicipio(
  a,
  e,
  s,
  f,
  v,
  m,
  n,
  w,
  i,
  c,
  z,
  j,
  d,
  gt,
  $,
  Y,
  E,
  h,
  t,
  g,
  Ct,
  r,
  T,
  _,
  S,
  l,
) {
  return html`<section
    class=${'card grow stc enter' + (a ? ' pcard scroll' : '')}
    key=${'t' + e}
  >
    <button
      class="upto tvhide"
      onClick=${s}
      aria-label=${'Voltar para ' + Te[f.uf]}
    >
      ‹ ${Te[f.uf]}
    </button>
    <div class="sh">
      <${hl} uf=${f.uf} size=${40} />
      <div>
        <h2 tabindex="-1" ref=${v}>${f.name}</h2>
        <div class="sub sub2 tn">
          <span>${f.uf}</span><span>${mt(m ? m.el : ae[e])}</span>
        </div>
      </div>
      <div class="x tvhide">
        <${xc} i=${e} /><button
          class="icon"
          aria-label="Fechar o município"
          onClick=${n}
        >
          <${mo} />
        </button>
      </div>
    </div>
    ${renderResultadoZona(w, i, c, z)}
    ${renderResultadoBairro(j, d, gt, $, Y, E)}
    <section class=${w || j ? 'zhide' : null}>
      <div class="lab">
        <span>Presidente no município</span
        >${h >= 1 ? html`<${Lo} status="apurado" />` : h <= 0 ? html`<${Lo} status="apurando" pst=${0} />` : null}
      </div>
      <p class="note tn">${renderEstadoApuracaoMunicipio(m, t, h)}</p>
      ${h > 0 ? g.slice(0, Ct).map((xt) => html`<${os} key=${xt.id} c=${xt} size=${30} bar votes cls=${r && r.office === 'pres' && r.id === xt.id ? 'spot' : ''} />`) : null}
      ${precisaDestacarCandidato(h, r, g, Ct) ? g.filter((xt) => xt.id === r.id).map((xt) => html`<${os} key=${'s' + xt.id} c=${xt} size=${30} bar votes cls="spot" />`) : null}${Xt === 2 ? html`<${aa} s=${ha(null, e)} />` : null}${Xn ? html`<${No} w=${ni[e]} />` : null}
    </section>
    ${renderIndicadoresMunicipio(h, m, T)}
    ${_ ? html`<${T1} m=${t} i=${e} L=${gt} bairro=${d} onBairro=${$} scroll=${a} />` : S ? html`<${_1} m=${t} i=${e} zone=${i} onZone=${c} zlink=${l} scroll=${a} />` : null}
    ${renderAcessoResultadosEstado(T, f, s)}
  </section>`;
}
function renderComparecimentoZona(w) {
  return w.d && w.d.comparecimento > 0
    ? html`<p class="then tn">
        <span>Comparecimento</span
        ><span>${_t(w.d.apurado ? w.d.comparecimento / w.d.apurado : 0)}%</span
        ><span
          >Brancos e nulos
          ${_t((w.d.brancos + w.d.nulos) / w.d.comparecimento)}%</span
        >
      </p>`
    : null;
}
function renderEstadoApuracaoMunicipio(m, t, h) {
  return m
    ? html`<${tn} n=${m.done} fmt=${ht} /> de ${ht(m.sections)} seções
        totalizadas`
    : t.live && vt.on
      ? html`${Pe(h)}% das seções. Revendo a noite, os votos do município só
        existem para agora.`
      : 'Carregando o município…';
}
function precisaDestacarCandidato(h, r, g, Ct) {
  return (
    h > 0 &&
    r &&
    r.office === 'pres' &&
    !g.slice(0, Ct).some((xt) => xt.id === r.id)
  );
}
function renderIndicadoresMunicipio(h, m, T) {
  return h > 0 && m
    ? html`<section class=${'tvhide' + (T ? ' xtall' : '')}>
        <div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
          <${Xs} k="Comparecimento" n=${m.turnout} fmt=${Ee} /><${Xs}
            k="Abstenção"
            n=${1 - m.turnout}
            fmt=${Ee}
          /><${Xs} k="Brancos e nulos" n=${m.bn} fmt=${Ee} />
        </div>
      </section>`
    : null;
}
function renderAcessoResultadosEstado(T, f, s) {
  return T
    ? null
    : html`<section class="tvhide tost">
        ${
          Xt === 2
            ? Ne.has(f.uf)
              ? html`<div class="lab"><span>Governador</span></div>
                  <p class="note">O 2º turno é contado por estado.</p>`
              : null
            : html`<div class="lab">
                  <span>Governador e Senado</span>
                </div>
                <p class="note">São contados por estado.</p>`
        }<button class="btn" style="align-self:flex-start" onClick=${s}>
          Ver o estado ${J(f.uf)}
        </button>
      </section>`;
}
function renderResultadoZona(w, i, c, z) {
  return w
    ? html`<section class="zsec" key=${'zs' + i}>
        <div class="lab">
          <span>Presidente na ${w.z}ª zona</span
          ><button
            class="lnk"
            onClick=${() => c && c(i)}
            aria-label="Voltar ao município inteiro"
          >
            Município inteiro
          </button>
        </div>
        <p class="note tn">
          ${w.nome ? w.nome + ' · ' : ''}${w.f == null ? 'carregando' : html`${Pe(w.f)}% das seções`}
          · ${mt(w.el)}
        </p>
        ${z.length ? z.slice(0, 3).map((xt) => html`<${os} key=${'z' + i + xt.id} c=${xt} size=${30} bar votes />`) : w.f == null ? null : html`<p class="note">Nenhuma seção totalizada ainda nesta zona.</p>`}
        ${renderComparecimentoZona(w)}
      </section>`
    : null;
}
function renderResultadoBairro(j, d, gt, $, Y, E) {
  return j
    ? html`<section class="zsec" key=${'bs' + d}>
        <div class="lab">
          <span
            >Presidente
            ${gt.bairros[d].length > 22 ? 'no bairro' : 'em ' + gt.bairros[d]}</span
          ><button
            class="lnk"
            onClick=${() => $ && $(d)}
            aria-label="Voltar ao município inteiro"
          >
            Município inteiro
          </button>
        </div>
        <p class="note tn">
          ${gt.bairros[d].length > 22 ? gt.bairros[d] + ' · ' : ''}${j.n}
          ${j.n === 1 ? 'local de votação' : 'locais de votação'} · ${mt(j.el)}
        </p>
        ${Y.length ? Y.slice(0, 3).map((xt) => html`<${os} key=${'b' + d + xt.id} c=${xt} size=${30} bar votes />`) : html`<p class="note">Nenhuma seção totalizada ainda neste bairro.</p>`}
        ${j.turnout != null ? html`<p class="then tn"><span>Comparecimento</span><span>${_t(j.turnout)}%</span><span>Brancos e nulos ${_t(j.bn)}%</span></p>` : null}${E ? html`<${aa} s=${E} />` : null}
      </section>`
    : null;
}
