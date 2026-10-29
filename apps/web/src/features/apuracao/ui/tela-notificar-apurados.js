import { Dl } from './regioes-1.js';
import { Dt, yt, html } from './formatacao-e-acessibilidade-1.js';
import { Ec } from './atualizacoes-1.js';
import { Geo } from '../geography.js';
export function criarNotificacaoDeApurados({ r, ot, be, S }) {
  return () => {
    if (!r) {
      ot.current = null;
      return;
    }
    const I = ot.current,
      K = new Map(Dl.list().map((te) => [te, Dt(be, te) >= 1]));
    if (I) {
      for (const [te, ne] of K)
        if (ne && I.get(te) === !1) {
          const Je = Ec(be, te),
            gn = Geo.munis[te];
          Je &&
            S({
              t: be.at,
              cand: Je.A,
              say: `${gn.name} apurada: ${yt(Je.A)} ${Je.v}.`,
              short: () =>
                html`<b>${gn.name}</b> apurada · ${yt(Je.A)} ${Je.v}`,
            });
        }
    }
    ot.current = K;
  };
}
