import { vl, xu } from "./candidatos-e-partidos-1.js";
import { html, pt, Xt, hn, Cn } from "./formatacao-e-acessibilidade-1.js";
import { ll, ma } from "./eventos-e-progresso-1.js";
import { Feed } from "../feed.js";
import { tn } from "./contagem-e-animacao-1.js";
import { Sim } from "../simulation.js";
import { Ks } from "./apuracao-e-votos-1.js";
import { Sa } from "./busca-e-preferencias-1.js";
export let Za, Ai;
export function initialize() {
  Za = (t, e) => {
    const n = t.pres[0],
      s = t.pres[1],
      a = vl(t);
    return a === "segundo-turno"
      ? html`${e(n)} e ${e(s)} vão ao 2º turno`
      : a === "eleito"
        ? html`${e(n)} é
          ${pt(n) ? "eleita" : "eleito"}${Xt === 2 ? " presidente" : ll}`
        : a === "wait"
          ? "Aguardando os resultados"
          : a === "start"
            ? Feed.LIVE
              ? html`<${xu} />`
              : "A apuração começa às 17:00"
            : a === "abroad"
              ? "Primeiros votos, do exterior"
              : a === "early"
                ? "Ainda é cedo: menos de 1% das seções"
                : a === "virada"
                  ? html`${e(n)} passa à frente às
                    ${hn(ma.filter((r) => r.t <= t.t).pop().t)}`
                  : html`<span class="ln">${e(n)} lidera</span
                      ><span class="ln nb"
                        >por <${tn} n=${n.votes - s.votes} fmt=${Cn}
                      /></span>`;
  };
  Ai = (t) => ({
    gov: Sim.UFS.filter((uf) => {
      const estado = t.ufs[uf];
      return !!estado && Ks(estado, "gov") && estado.govStatus === "apurando";
    }),
  });
}
