import {
  html,
  ht,
  lt,
  pe,
  nt,
  yt,
  mt,
} from "./formatacao-e-acessibilidade-1.js";
import { br, Ei, Xs } from "./paineis-e-projecoes-1.js";
import { tn } from "./contagem-e-animacao-1.js";
import { Geo } from "../geography.js";
import { To } from "./candidatos-e-partidos-1.js";
import { ae } from "./apuracao-e-votos-1.js";
import { ka } from "./resultados-e-listas-1.js";
import { Zl } from "./projecoes-graficos-2.js";
function renderizarPainelNacional(
  E,
  M,
  S,
  Y,
  a,
  c,
  g,
  h,
  i,
  j,
  l,
  m,
  r,
  s,
  t,
  v,
  w,
  x,
  z,
) {
  if (t.empty) return null;
  return html`<section class="card natc enter grow" aria-label="Brasil">
    ${l && a && br(t).length ? html`<div class="ns"><${Ei} m=${t} onNext=${a} /></div>` : null}
    ${j}
    <${Zl} m=${t} own fore=${false} />
    ${
      !t.empty
        ? html`<div class="ns ns-pa">
            <div class="nsh"><h3>Participação</h3></div>
            <div class="kpis2">
              ${Y.map(([T, Ct, xt]) => html`<${Xs} key=${T} k=${T} n=${Ct} fmt=${xt} still=${T === "Votos válidos" || !c} />`)}
            </div>
            ${c && i.sections ? html`<div class="kpi1 tn"><${Xs} k="Seções totalizadas" n=${i.secDone} fmt=${(T) => ht(T) + " de " + ht(i.sections)} /></div>` : null}
          </div>`
        : null
    }
    ${
      c
        ? html`<div class="ns ns-vr">
            <div class="nsh">
              <h3>Viradas</h3>
              ${v ? html`<div class="seg2 vrtabs" role="group" aria-label="Viradas"><button type="button" aria-pressed=${h === "noite"} onClick=${() => g("noite")}>Na apuração</button><button type="button" aria-pressed=${h === "cid"} onClick=${() => g("cid")}>Cidades${S.length ? html` <span class="tn"><${tn} n=${S.length} fmt=${ht} /></span>` : null}</button></div>` : null}
            </div>
            <div class="vrl" ref=${w} onScroll=${z}>
              ${
                h === "cid" && v
                  ? x.length
                    ? x.map((T) => {
                        const Ct = Geo.munis[T],
                          xt = lt[pe(t, T)],
                          Bt = html`<${To}
                              r=${{
                                uf: Ct.uf,
                              }}
                              plain
                            /><span
                              ><b>${Ct.name}</b> virou para
                              <i style=${"background:" + nt(xt)}></i
                              >${yt(xt)}</span
                            >`;
                        return r
                          ? html`<button
                              class="vr vc"
                              data-k=${M(T)}
                              key=${M(T)}
                              onClick=${() => r(T)}
                              title=${"Desde o 1º turno · " + mt(ae[T])}
                              ...${ka(s, Ct.uf)}
                            >
                              ${Bt}
                            </button>`
                          : html`<div class="vr vc" data-k=${M(T)} key=${M(T)}>
                              ${Bt}
                            </div>`;
                      })
                    : html`<p class="vr0" key="c0">
                        Nenhuma cidade mudou de lado desde o 1º turno até agora.
                      </p>`
                  : m.length
                    ? m.map(E)
                    : html`<p class="vr0" key="v0">
                        Nenhuma virada até agora.
                      </p>`
              }
            </div>
          </div>`
        : null
    }
  </section>`;
}
export { renderizarPainelNacional };
