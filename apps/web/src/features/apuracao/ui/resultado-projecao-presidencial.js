import {
  html,
  yt,
  _t,
  kt,
  ht,
  Sn,
  nt,
} from './formatacao-e-acessibilidade-1.js';
import { renderizarSituacaoDefinida } from './resultado-projecao-situacao.js';
import { wr, Xs } from './paineis-e-projecoes-1.js';
import { Za } from './candidatos-e-partidos-2.js';
import { Io, Po, an, oo, Ci } from './candidatos-e-partidos-1.js';
import { tn } from './contagem-e-animacao-1.js';
import { renderizarResumoDaProjecao } from './resultado-projecao-resumo.js';
import { renderizarDemaisCandidaturas } from './resultado-projecao-candidaturas.js';
function renderizarResultadoPresidencial(
  tipoResultado,
  projecao,
  botaoTodos,
  candidatoDestacado,
  modoTV,
  decimais,
  compacto,
  definido,
  primeirosAdicionais,
  demaisCandidatos,
  lider,
  lideres,
  formatarNome,
  reduzido,
  aoProximo,
  modelo,
  apuracao,
  destaqueAdicional,
  indicadores,
  restantes,
  transicao,
) {
  return html`<section
    class=${'card hero enter' + (apuracao.pst < 0.01 ? ' early' : '')}
  >
    <div class="kick">
      <span>Brasil</span
      >${renderizarSituacaoDefinida(definido, lider, reduzido, apuracao)}
    </div>
    ${modoTV || reduzido ? null : html`<${wr} r=${apuracao} />`}
    ${
      reduzido
        ? null
        : html`<div class="sentbox">
            ${transicao ? html`<h2 class="sent out" key=${'o' + transicao.kind} aria-hidden="true">${Za(transicao.m, formatarNome)}</h2>` : null}
            <h2 class="sent" key=${tipoResultado}>
              ${Za(modelo, formatarNome)}
            </h2>
          </div>`
    }
    ${
      reduzido
        ? null
        : html`<div class="leaders">
            ${lideres.map(
              (q, le) =>
                html`<div
                  class=${'leader' + (le ? ' r' : '') + (q.id === candidatoDestacado ? ' spot' : '') + Io(q)}
                  key=${q.id}
                  ...${Po(q)}
                >
                  <div class="who">
                    <${an} c=${q} size=${52} />
                    <div>
                      <div class="nm">${yt(q)}</div>
                      <${oo} c=${q} />
                    </div>
                  </div>
                  <div class="fig">
                    <${tn} n=${q.share} fmt=${(be) => _t(be, decimais)} /><sup
                      style=${'color:' + kt(q)}
                      >%</sup
                    >
                  </div>
                  <div class="votes tn">
                    <${tn} n=${q.votes} fmt=${ht} /> votos
                  </div>
                </div>`,
            )}
          </div>`
    }
    <div class="sharebox">
      ${reduzido ? null : html`<${Ci} left=${lideres[0]} right=${lideres[1]} done=${definido} />`}
      ${indicadores.length ? html`<div class="kv">${indicadores.map((q, le) => html`<div key=${le + q[0]}><span>${q[0]}</span><b class="tn">${q[2] ? html`<${tn} n=${q[1]} fmt=${q[2]} />` : q[1]}</b></div>`)}</div>` : null}
    </div>
    ${
      Sn && Sn.pres
        ? html`<p
            class="then t1 tn"
            title="O resultado do 1º turno, em 4 de outubro"
          >
            <span>1º turno</span>${lideres.map((q) => {
              const le = Sn.pres.find((be) => +be.n == +q.n);
              return le
                ? html`<span key=${q.id}
                    ><i style=${'background:' + nt(q)}></i>${yt(q)}
                    ${_t(le.share)}%</span
                  >`
                : null;
            })}
          </p>`
        : null
    }
    ${renderizarResumoDaProjecao(projecao, lideres)}
    ${renderizarDemaisCandidaturas(botaoTodos, candidatoDestacado, compacto, definido, primeirosAdicionais, demaisCandidatos, aoProximo, modelo, destaqueAdicional, restantes)}${compacto ? null : html`<div class="kpis nomid"><${Xs} k="Votos válidos" n=${apuracao.valid} fmt=${ht} still /><${Xs} k="Comparecimento" n=${apuracao.elDone ? apuracao.votes / apuracao.elDone : 0} fmt=${(q) => _t(q) + '%'} /><${Xs} k="Brancos e nulos" n=${apuracao.votes ? (apuracao.blank + apuracao.nul) / apuracao.votes : 0} fmt=${(q) => _t(q) + '%'} /></div>`}
  </section>`;
}
export { renderizarResultadoPresidencial };
