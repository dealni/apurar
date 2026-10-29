import { blocksPanelShortcut, blocksSearchShortcut } from "../../../runtime/interaction-guards.ts";
import { useEffect } from './formatacao-e-acessibilidade-1.js';
import { Sa } from './busca-e-preferencias-1.js';
export function useAtalhosDaTela({ g, w, x, go, l, d, On, i, ms, De }) {
  useEffect(() => {
    const I = (K) => {
      if (bloquearAtalho(K)) return;
      if (ehAtalhoDeBusca(K)) {
        (K.preventDefault(), g || w((ne) => !ne));
        return;
      }
      if (K.metaKey || K.ctrlKey || K.altKey) return;
      (K.key === '/' && !g
          ? (K.preventDefault(), w(!0))
          : /^[123]$/.test(K.key) && !g && !x && Sa[+K.key - 1]
            ? go(Sa[+K.key - 1][0])
            : K.key === 'Escape' &&
              voltarNaNavegacao({
                l,
                d,
                x,
                w,
                g,
                On,
                i,
                ms,
                De,
              }));
    };
    return (
      addEventListener('keydown', I),
      () => removeEventListener('keydown', I)
    );
  }, [g, i, x, l]);
}
function voltarNaNavegacao({ l, d, x, w, g, On, i, ms, De }) {
  return l
    ? d(!1)
    : x
      ? w(!1)
      : g
        ? On()
        : i.focus === 'ZZ' && i.town != null
          ? ms()
          : i.focus === 'ZZ' && i.country
            ? De('pres', 'ZZ')
            : i.town != null
              ? De(i.office, i.focus)
              : i.focus && De(i.office, null);
}

function ehAtalhoDeBusca(event) {
  return (
    !event.altKey &&
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === 'k'
  );
}

function bloquearAtalho(event) {
  return (
    event.isComposing ||
    (ehAtalhoDeBusca(event)
      ? blocksSearchShortcut(event)
      : blocksPanelShortcut(event))
  );
}
