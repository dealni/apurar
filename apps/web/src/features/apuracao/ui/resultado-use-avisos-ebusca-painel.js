import { html } from './formatacao-e-acessibilidade-1.js';
import { Q1 } from './busca-e-preferencias-1.js';
export function useAvisosEBuscaPainel(contexto) {
  const {
    tv,
    notice,
    conn,
    ev,
    toast,
    searchOpen,
    onSearchClose,
    onChoose,
    focus,
  } = contexto;
  const on = notice || (conn && conn.aviso) || null;
  const Vs = on
    ? html`<p class="aviso" role="status" key=${on}>${on}</p>`
    : null;
  const ls = tv ? ev : toast;
  const On = html`<p class="sr" aria-live="polite" aria-atomic="true">
    ${ls && ls.say ? ls.say : ''}
  </p>`;
  const yn = searchOpen
    ? html`<${Q1}
        onClose=${onSearchClose}
        onChoose=${onChoose}
        focus=${focus}
      />`
    : null;
  return {
    Vs,
    On,
    yn,
  };
}
