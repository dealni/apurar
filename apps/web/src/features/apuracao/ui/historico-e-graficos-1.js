import { GraficoApuracao } from './indicador-eventos-grafico-componente.js';
import { ss, Fn, oa, al } from './apuracao-e-votos-1.js';
import {
  lt,
  Vt,
  html,
  nt,
  _t,
  Wn,
  re,
  hn,
  yt,
  H,
  pt,
} from './formatacao-e-acessibilidade-1.js';
import { qoState } from './eventos-e-progresso-1.js';
import { Ao } from './contagem-e-animacao-1.js';
import { Oa } from './candidatos-e-partidos-1.js';
export let bc, qr, p1, Br, Hr, Rl, $1, h1, Oo;
export function initialize() {
  bc = GraficoApuracao;
  qr = (t) => Fn.filter((e) => e.t <= t.t && e.pst >= 0.01).length > 1;
  p1 = (t) => [t.pres[0], t.pres[1]].sort(ss).map((e) => e.k);
  Br = ({ m: t, ring: e = !0 }) => {
    const n = p1(t),
      s = qr(t),
      a = !!oa && n.every((r) => al(lt[r], oa.p[0]) != null);
    return html`<div class="lg">
      ${s ? n.map((r) => html`<span key=${r}><i style=${'background:' + nt(lt[r])}></i>${Wn(lt[r])}</span>`) : null}${s && a ? html`<span class="l22" title="A apuração do 1º turno, em 4 de outubro, pelo mesmo percentual de seções: o percentual de cada um a cada ponto da contagem"><i></i>1º turno</span>` : null}${s && e && Vt(t) ? html`<span class="lpj" title=${re}><i></i>Projeção</span>` : null}
    </div>`;
  };
  Hr = ({ m: t, labels: e = !1 }) => {
    const [n, s] = Ao(),
      a = qr(t);
    return html`<div class="plot" ref=${n}>
      ${a ? (s.w && s.h >= 36 ? html`<${bc} m=${t} W=${s.w} H=${s.h} labels=${e} />` : null) : html`<p class="wait">A curva começa com 1% das seções</p>`}
    </div>`;
  };
  Rl = ({ m: t }) =>
    html`<section class="card grow chart enter">
      <div class="hd">
        <h3>Ao longo da apuração</h3>
        <${Br} m=${t} />
      </div>
      <${Hr} m=${t} />
    </section>`;
  $1 = (t, e = !1) =>
    e
      ? {
          id: 'curva',
          title: 'Ao longo da apuração',
          top: html`<${Br} m=${t} ring=${!1} />`,
          vis: html`<${Hr} m=${t} labels />`,
          foot: html`<${h1} m=${t} />`,
        }
      : {
          id: 'curva',
          title: 'Ao longo da apuração',
          top: html`<${Br} m=${t} />`,
          vis: html`<${Hr} m=${t} />`,
        };
  h1 = ({ m: t }) => {
    const e = Vt(t),
      n = t.n,
      s = e
        ? html`<button
            class="fcinfo"
            type="button"
            title=${re + ' Faixa de 98%: ± ' + _t(e.band) + ' pontos.'}
            aria-label=${'Como é feita: ' + re}
          >
            i
          </button>`
        : null,
      a =
        n.status !== 'apurando'
          ? qoState.value && qoState.value.t != null
            ? 'Definido às ' + hn(qoState.value.t) + '.'
            : 'Definido.'
          : e && e.call != null
            ? html`<b
                >${yt(H(e.call))}
                ${pt(H(e.call)) ? 'deve ser eleita' : 'deve ser eleito'}</b
              >`
            : e
              ? html`Margem de ± <span class="tn">${Oa(e.band)}</span>.`
              : 'A projeção começa com 15% das seções.';
    return html`<p class="fcfoot pjf">${a}${s}</p>`;
  };
  Oo = {
    data: {},
    at: {},
    subs: new Set(),
  };
}
