import {
  useErrorBoundary,
  useEffect,
  html,
  useState,
} from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';
export let Be, $l, vi, Ho, mo, gi, gu, So, bu, yu, Fa;
function inicializarLimitesDeErroEPresenca() {
  Be = ({
    name: t,
    children: e,
    quiet: n = !1,
    retry: s = 4e3,
    fallback: a = null,
  }) => {
    const [r, u] = useErrorBoundary((i) =>
      console.error(`[apuração] ${t}:`, i),
    );
    return (
      useEffect(() => {
        if (!r) return;
        const i = setTimeout(u, s);
        return () => clearTimeout(i);
      }, [r]),
      r
        ? a
          ? html`<${a} />`
          : n
            ? null
            : html`<section class="card oops" role="status">
                <p>Esta parte da tela teve um problema e volta em instantes.</p>
              </section>`
        : e
    );
  };
  $l = () =>
    html`<header class="hudtop">
      <div class="brand"><b>Apuração 2026</b></div>
      <div class="status">
        ${Feed.LIVE ? null : html`<span class="sim">Simulação</span>`}
      </div>
    </header>`;
  vi = (t, e) => {
    const [n, s] = useState(t),
      [a, r] = useState(!1);
    return (
      useEffect(() => {
        if (t) {
          (s(t), r(!1));
          return;
        }
        if (!n) return;
        r(!0);
        const u = setTimeout(() => {
          (s(null), r(!1));
        }, e);
        return () => clearTimeout(u);
      }, [t]),
      [t || n, !t && a]
    );
  };
}

function inicializarIcones() {
  Ho = ({ d: t }) =>
    html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d=${t < 0 ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`;
  mo = () =>
    html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3 3l8 8M11 3l-8 8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>`;
  gi = () =>
    html`<svg width="15" height="14" viewBox="0 0 15 14" aria-hidden="true">
      <rect
        x="1.5"
        y="3.5"
        width="8.5"
        height="7"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M10 6.2l3.5-2v5.6L10 7.8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>`;
  gu = () =>
    html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2 5.5V2h3.5M8.5 2H12v3.5M12 8.5V12H8.5M5.5 12H2V8.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`;
  So = ({ size: t = 13 }) =>
    html`<svg
      class="globe"
      width=${t}
      height=${t}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6.4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
      />
      <ellipse
        cx="8"
        cy="8"
        rx="2.8"
        ry="6.4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.1"
      />
      <path
        d="M1.8 8h12.4M2.8 4.8h10.4M2.8 11.2h10.4"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>`;
  bu = ({ size: t = 40 }) =>
    html`<span class="sm gm" style=${`--s:${t}px`}
      ><${So} size=${Math.round(t * 0.56)}
    /></span>`;
  yu = () =>
    html`<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>`;
}

function inicializarComunicacaoDePresenca() {
  Fa = {
    n: 0,
    subs: new Set(),
  };
  if (Feed.LIVE && window.crypto && crypto.getRandomValues) {
    const t = Array.from(crypto.getRandomValues(new Uint8Array(16)), (r) =>
      (r % 36).toString(36),
    ).join('');
    let e = 15e3,
      n = 0;
    const s = (r) => {
        ((Fa.n = r), Fa.subs.forEach((u) => u(r)));
      },
      a = () => {
        if ((clearTimeout(n), document.visibilityState === 'hidden')) return;
        const r = Feed.over() ? 60 : 15;
        fetch('/api/vivo', {
          method: 'POST',
          body: t + ' ' + r,
          cache: 'no-store',
        })
          .then((u) => (u.ok ? u.json() : Promise.reject(u.status)))
          .then(
            (u) => {
              ((e = r * 1e3), s(u && u.n > 0 ? Math.round(u.n) : 0));
            },
            () => {
              ((e = Math.min(3e5, e * 2)), s(0));
            },
          )
          .then(() => {
            (clearTimeout(n), (n = setTimeout(a, e)));
          });
      };
    (document.addEventListener('visibilitychange', () => {
      document.visibilityState === 'visible' && a();
    }),
      a());
  }
}

export function initialize() {
  inicializarLimitesDeErroEPresenca();
  inicializarIcones();
  inicializarComunicacaoDePresenca();
}
