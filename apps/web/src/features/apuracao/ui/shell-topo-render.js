import { shareFromMap } from "../../../runtime/share-dialog";
import { Ya } from './busca-e-preferencias-1.js';
import { html, $n, hn } from './formatacao-e-acessibilidade-1.js';
import { ku } from './candidatos-e-partidos-1.js';
import { wr } from './paineis-e-projecoes-1.js';
import { Bo } from './contagem-e-animacao-1.js';
import { Feed } from '../feed.js';
import { zt } from './municipios-e-distritos-2.js';
import { n1 } from './mapa-dicas-e-legenda-2.js';
import { gi, mo, gu } from './hud-e-comunicacao-1.js';
export function renderEstadoDaConexao({ T, E, Y, Ct, Bt }) {
  return T || E || Y === 'replay'
    ? html`<span
        class=${'live' + (Y === 'replay' ? ' replay' : '') + (E ? ' warn' : '') + (T ? ' wait' : '')}
        title=${T ? null : Ct + hn(Bt) + ' (horário de Brasília)'}
        ><i key=${Y === 'replay' ? 'r' : E || T ? Y : 't' + Bt}></i
        >${T ? html`<span class="lt">Conectando aos resultados…</span>` : html`<span class="lt tn"><span class="lw">${Ct}</span><${Bo} v=${hn(Bt)} /></span>`}</span
      >`
    : null;
}
export function renderControlesDeTela({ h, d, l, c, u }) {
  return h
    ? html`${d ? html`<button class="btn tvexit tvcam" aria-pressed=${l} onClick=${d} title=${l ? 'Devolver o espaço da câmera ao mapa' : 'Reservar um espaço para a câmera de quem transmite'}><${gi} /><span class="lbl">Câmera</span></button>` : null}<button
          class="btn tvexit"
          onClick=${c}
          aria-label="Sair da tela cheia"
          title="Sair da tela cheia (Esc)"
        >
          <${mo} />
        </button>`
    : html`<button
        class="btn tvb"
        onClick=${u}
        aria-label="Tela cheia"
        title="Tela cheia, em tamanho de TV"
      >
        <${gu} /><span class="map-action-label">Tela cheia</span>
      </button>`;
}
export function rotuloDoAtalhoDeBusca() {
  return $n ? '⌘K' : 'Ctrl K';
}
export function renderSeletorDeCargo({ g, a, r, h, t }) {
  return g ? null : html`<${Ya} office=${a} set=${r} tv=${h} m=${t} />`;
}
export function renderProgressoDoTopo({ h, _, t }) {
  return h && _ && t.n.valid > 0 ? html`<${wr} r=${t.n} tv />` : null;
}
export function renderBuscaNoTelefone({ g, ve }) {
  return g ? ve : null;
}
export function renderAudienciaNoTopo() {
  return null;
}
export function renderSimulacaoNoTopo({ f, m }) {
  return Feed.LIVE
    ? null
    : html`<button class="sim" aria-expanded=${f} onClick=${() => m(!f)}>
        Simulação
      </button>`;
}
export function renderBuscaNoDesktop({ g, ve }) {
  return g ? null : ve;
}
export function renderExteriorNoTopo({ h, M, v, S }) {
  return h || !zt || !M ? null : html`<${n1} on=${v} onClick=${v ? S : M} />`;
}
export function renderCompartilharNoTopo({ h, $, label = "Compartilhar" }) {
  return Feed.LIVE && !h && $
    ? html`<button
        class="btn shb"
        onClick=${(event) => shareFromMap(event, $)}
        aria-label=${label}
        title=${label}
      >
        <${ku} /><span class="map-action-label">${label}</span>
      </button>`
    : null;
}

export function renderMenuDoSite() {
  return html`<button type="button" class="site-navigation-trigger" data-site-navigation aria-label="Abrir navegação" aria-haspopup="dialog" aria-controls="site-navigation-dialog" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg><span>Menu</span></button>`;
}

/** Ações ocasionais ficam a um toque, sem disputar espaço com busca e mapa. */
export function renderAcoesDoTopo({ g, h, M, v, S, $, shareLabel, d, l, c, u }) {
  const actions = html`${renderExteriorNoTopo({ h, M, v, S })}${renderCompartilharNoTopo({ h, $, label: shareLabel })}${renderControlesDeTela({ h, d, l, c, u })}`;
  return g && !h
    ? html`<details class="map-actions" onKeyDown=${fecharAcoesComEscape}>
        <summary aria-label="Ações do mapa" title="Ações do mapa">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          <span class="map-actions-name">Ações</span>
        </summary>
        <div class="map-actions-panel" role="group" aria-label="Ações do mapa" onClick=${fecharAcoesAposEscolha}>${actions}</div>
      </details>`
    : actions;
}

function fecharAcoesComEscape(event) {
  if (event.key !== "Escape") return;
  const details = event.currentTarget;
  if (!details.open) return;
  event.preventDefault();
  event.stopPropagation();
  details.open = false;
  details.querySelector("summary").focus();
}

function fecharAcoesAposEscolha(event) {
  if (!event.target.closest("button")) return;
  const details = event.currentTarget.closest("details");
  details.open = false;
  details.querySelector("summary").focus();
}
