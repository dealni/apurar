import {
  useErrorBoundary,
  useEffect,
  html,
  render,
} from './formatacao-e-acessibilidade-1.js';
import { zd } from './acesso-e-barras-1.js';
import { _d } from './tela-principal-1.js';
import { Feed } from '../feed.js';
import { ArchiveSource } from './arquivo-source.js';
export let ApuracaoApp, mountApuracao, Nd;
export function initialize() {
  ApuracaoApp = () => {
    const [t, e] = useErrorBoundary((f) => console.error('[apuração]', f));
    return (
      useEffect(() => {
        if (!t) return;
        const f = /tv/.test(location.hash),
          m = setTimeout(
            () => (f && zd() ? location.reload() : e()),
            f ? 8e3 : 5e3,
          );
        return () => clearTimeout(m);
      }, [t]),
      t
        ? html`<div class="guard" role="alert">
            <p class="gt">Apuração 2026</p>
            <p>A tela teve um problema e volta em instantes.</p>
            <div class="gr">
              <button class="btn" onClick=${() => location.reload()}>
                Recarregar agora
              </button>
            </div>
          </div>`
        : html`<${ArchiveSource} /><div class="frame"><${_d} /></div>`
    );
  };
  addEventListener('unhandledrejection', (t) =>
    console.warn('[apuração] promessa rejeitada:', t.reason),
  );
  mountApuracao = () => {
    if (window.APURACAO_SEM_SUPORTE) return;
    const t = document.getElementById('app');
    try {
      ((t.textContent = ''), render(html`<${ApuracaoApp} />`, t));
    } catch (e) {
      (console.error('[apuração]', e),
        window.APURACAO_FALHA &&
          window.APURACAO_FALHA(
            'A página não conseguiu abrir neste navegador.',
          ));
      return;
    }
    window.APURACAO_OK && window.APURACAO_OK();
  };
  Nd =
    Feed.LIVE && !window.APURACAO_SEM_SUPORTE
      ? new Promise((t) => {
          const e = Feed.on('snap', () => {
            (e(), t());
          });
          Feed.start();
        })
      : null;
  Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : null, Nd]),
    new Promise((t) => setTimeout(t, 1500)),
  ]).then(mountApuracao, mountApuracao);
}
