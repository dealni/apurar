import { navigatePicker } from "../../../runtime/picker-keyboard.ts";
import { html, yt, Ee } from './formatacao-e-acessibilidade-1.js';
import { ya, e1, ac } from './mapa-dicas-e-legenda-1.js';
import { an, oo } from './candidatos-e-partidos-1.js';
export function renderSeletor({
  level: e,
  setLevel: n,
  model: s,
  cand: a,
  setCand: r,
  room: i,
  openMenu: c,
  setOpenMenu: l,
  containerRef: d,
  selectedCandidate: $,
  restoreFocus: f,
  isSelected: m,
  candidates: h,
  primaryLevels: g,
  extraLevels: v,
  selectedLevel: M,
  isDisabled: S,
  selectLevel: x,
}) {
  return html`<div
    class="seg2 tvhide"
    role="group"
    aria-label="O mapa mostra"
    ref=${d}
    onKeyDown=${(event) => {
      if (c && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        l(null);
        f();
      }
    }}
    onfocusout=${(w) => {
      c &&
        w.relatedTarget &&
        !w.currentTarget.contains(w.relatedTarget) &&
        l(null);
    }}
  >
    ${g.map(
      ([w, z]) =>
        html`<button
          key=${w}
          aria-pressed=${m(w)}
          onClick=${() => {
            (l(null), n(w));
          }}
        >
          ${z}
        </button>`,
    )}
    ${
      v.length
        ? html`<button
            class="cb"
            aria-pressed=${!!M}
            aria-haspopup=${c === "cand" ? "listbox" : "menu"}
            aria-expanded=${!!c}
            aria-label=${M ? 'O mapa mostra: ' + (M[0] === 'cand' && $ ? 'Candidato, ' + yt($) : M[1]) + '. Outras leituras' : 'Outras leituras do mapa'}
            onKeyDown=${(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                l("more");
              }
            }}
            onClick=${() => l(c ? null : 'more')}
          >
            ${M && M[0] === 'cand' && $ ? html`<${an} c=${$} size=${18} round /><span class="cn">${yt($)}</span>` : html`<${e1} /><span class="cn">${M ? M[1] : 'Mais mapas'}</span>`}<${ac} />
          </button>`
        : null
    }
    ${
      c === 'more'
        ? html`<div
            class="candpick morepick"
            role="menu"
            onKeyDown=${navigatePicker}
            aria-label="Outras leituras do mapa"
          >
            ${v.map(
              ([w, z]) =>
                html`<button
                  key=${w}
                  role="menuitemradio"
                  tabindex="-1"
                  aria-checked=${e === w}
                  disabled=${S(w)}
                  title=${S(w) ? 'Este mapa mostra só os números de agora' : null}
                  onClick=${() => x(w)}
                >
                  <span class="nm"
                    ><span>${z}</span
                    >${ya[w] ? html`<small>${ya[w][1]}</small>` : null}</span
                  >${w === 'cand' ? html`<${ac} />` : null}
                </button>`,
            )}
          </div>`
        : null
    }
    ${
      c === 'cand'
        ? html`<div
            class="candpick"
            role="listbox"
            onKeyDown=${navigatePicker}
            aria-label="Candidato no mapa"
            style=${i != null ? `max-height:${Math.max(0, i)}px` : null}
          >
            ${h.map(
              (w) =>
                html`<button
                  key=${w.id}
                  role="option"
                  tabindex="-1"
                  aria-selected=${e === 'cand' && w.k === a}
                  onClick=${() => {
                    (r(w.k), l(null), f());
                  }}
                >
                  <${an} c=${w} size=${32} round /><span class="nm"
                    ><span>${yt(w)}</span><${oo} c=${w} /></span
                  >${s.n.valid > 0 ? html`<b class="tn">${Ee(w.share)}</b>` : null}
                </button>`,
            )}
          </div>`
        : null
    }
  </div>`;
}
