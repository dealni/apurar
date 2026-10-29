import { podeDesenharDistribuicao } from "./resultado-projecao-validacao-grafico.js";
import { Feed } from "../feed.js";
import { Oo } from "./historico-e-graficos-1.js";
import {
  H,
  html,
  yt,
  kt,
  ue,
  Wn,
  _t,
  nt,
} from "./formatacao-e-acessibilidade-1.js";
import { We, Fe } from "../object-helpers.js";
import { ml, an } from "./candidatos-e-partidos-1.js";
import { Ao } from "./contagem-e-animacao-1.js";
export let Ca, yc, kc, wc, Cc, m1, Wa, v1, Mc, g1, Ac, b1, y1, k1, w1;
export function initialize() {
  Ca = definirCa;
  yc = definiryc;
  kc = definirkc;
  wc = definirwc;
  Cc = definirCc;
  m1 = definirm1;
  Wa = definirWa;
  v1 = definirv1;
  Mc = {
    kalshi:
      '<svg aria-hidden="true" focusable="false" viewBox="0 0 772 226" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M255.7 58.2C210.7 58.2 183.4 78.5 181.2 113.9H228.1C229.9 100.4 238.6 93.3 253.8 93.3C269 93.3 277.4 100.1 277.1 110.8C276.8 119.2 271.5 122.9 258.2 124.7L238.9 127.2C195.5 132.4 175 148.7 175 178C175 207.2 195.5 226 229.6 226C251.3 226 267.8 218.3 278 203.5V222.6H326.4V117.9C326.4 78.5 302.5 58.2 255.7 58.2ZM245.4 192.4C231.5 192.4 223.7 186.3 223.7 174.9C223.7 164.1 230.5 158.9 249.5 156.1L258.2 154.9C265.8 153.8 272.2 152.3 277.4 150.1V166.3C277.4 181.7 264.4 192.4 245.4 192.4ZM343.5 3.4H393.1V222.6H343.5V3.4ZM105.2 105.6L179.7 222.6H115.1L54.3 121.9V222.6H0V3.4H54.3V99.1L119.5 3.4H177.5L105.2 105.6ZM716.1 26.2C716.1 12 728.6 0 744.1 0C759.6 0 772 12 772 26.2C772 40.3 759.6 52.3 744.1 52.3C728.6 52.3 716.1 40.6 716.1 26.2ZM544.9 172.4C544.9 208.4 518.5 226 474.7 226C431 226 404 206.9 402.4 172.1H448.4C450.2 185.4 456.4 192.7 474.4 192.7C489.9 192.7 497.4 186.6 497.4 177.3C497.4 168.1 488.4 163.5 465.7 160.1C422.6 154.3 405.2 141.6 405.2 109.3C405.2 75.1 436.6 58.2 471.6 58.2C509.2 58.2 536.5 71.4 540.2 108.7H495.2C493.1 97 486.2 91.1 472 91.1C458.6 91.1 451.2 97.3 451.2 105.6C451.2 114.8 458.6 118.2 480.6 121.3C523.1 127.2 544.9 137.9 544.9 172.4ZM719.2 61.6H768.9V222.6H719.2V61.6ZM702.2 115.8V222.6H652.5V124.4C652.5 107.1 645.4 98.2 629.9 98.2C614.4 98.2 603.5 108.1 603.5 127.5V222.6H553.9V3.4H603.5V85.6C611.3 70.2 627.8 58.2 651.6 58.2C681.4 58.2 702.2 77 702.2 115.8L702.2 115.8Z" fill="currentColor" /></svg>',
    polymarket:
      '<svg aria-hidden="true" focusable="false" viewBox="0 0 911 168" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#pm0)"><g clip-path="url(#pm1)"><path fill-rule="evenodd" clip-rule="evenodd" d="M395.7 132.2V29.2H378.7V132.2H395.7ZM228.9 96.1V132.2H211.2V34.6H249.3C256.8 34.6 263.3 35.9 268.8 38.6C274.3 41.2 278.5 44.9 281.3 49.6C284.2 54.4 285.6 59.7 285.6 65.8C285.6 72.1 284.2 77.5 281.4 82.1C278.5 86.6 274.4 90.1 269 92.5C263.5 94.9 257 96.1 249.3 96.1H228.9ZM228.9 82.2H249.3C255.7 82.2 260.3 80.7 263.4 77.8C266.4 74.9 267.9 70.9 267.9 65.9C267.9 62.8 267.2 59.9 265.9 57.3C264.6 54.7 262.6 52.6 259.8 51C257 49.4 253.5 48.6 249.3 48.6H228.9V82.2ZM329.5 133.5C336.6 133.5 342.7 131.9 347.9 128.8C353 125.6 357 121.2 359.8 115.6C362.5 110 363.9 103.7 363.9 96.7V95.3C363.9 88.2 362.5 81.9 359.8 76.3C357 70.7 353 66.3 347.8 63.1C342.6 59.9 336.5 58.3 329.4 58.3C322.4 58.3 316.3 59.9 311.1 63.1C305.9 66.3 301.9 70.7 299.2 76.3C296.4 81.9 295 88.2 295 95.3V96.7C295 103.7 296.4 110 299.2 115.6C301.9 121.2 305.9 125.6 311.1 128.8C316.3 131.9 322.4 133.5 329.5 133.5ZM316.4 113.6C319.3 117.9 323.7 120.1 329.5 120.1C333.4 120.1 336.6 119.1 339.2 117C341.8 114.9 343.8 112.1 345 108.6C346.3 105.1 346.9 101.1 346.9 96.7V95.3C346.9 90.9 346.3 86.9 345 83.4C343.8 79.8 341.8 77 339.2 74.9C336.6 72.8 333.3 71.7 329.4 71.7C325.5 71.7 322.3 72.8 319.7 74.9C317.1 77 315.2 79.8 313.9 83.4C312.7 86.9 312 90.9 312 95.3V96.7C312 103.5 313.5 109.2 316.4 113.6ZM435.1 156.1C431.6 159.7 426.6 161.5 420.2 161.5C417.9 161.5 415.2 161.1 412 160.3V147.5L415.2 147.6C419.2 147.6 422.3 146.9 424.4 145.5C426.5 144.1 428.2 141.6 429.4 138.1L431.8 131.9L405.8 59.7H424.2L439.5 108.3L454.4 59.7H472.5L443.1 143.2C441.2 148.2 438.5 152.5 435.1 156.1ZM498.8 132.2V79.8C501.5 74.5 506.1 71.9 512.6 71.9C516.9 71.9 520.1 73 522.3 75C524.5 77.1 525.6 80.5 525.6 85.4V132.2H542.6V83.9L542.6 82.3C543.6 79.2 545.3 76.6 547.6 74.8C550 72.9 553 71.9 556.6 71.9C560.9 71.9 564.1 72.9 566.3 74.9C568.4 76.8 569.5 80.2 569.5 85.2V132.2H586.5V85.3C586.5 75.9 584.4 69.1 580.3 64.8C576.2 60.5 570.2 58.3 562.4 58.3C557.4 58.3 553 59.3 549.2 61.2C545.4 63.2 542.2 65.9 539.7 69.4C537.8 65.6 535.2 62.9 531.7 61C528.3 59.2 524.2 58.3 519.6 58.3C515 58.3 511 59.1 507.4 60.6C503.8 62.2 500.8 64.4 498.3 67.3L497.7 59.7H481.8V132.2H498.8ZM637 131.3C633.8 132.8 630.1 133.5 626 133.5C621.2 133.5 616.9 132.6 613 130.7C609.2 128.8 606.2 126.2 604.1 122.9C602 119.6 600.9 115.9 600.9 111.8C600.9 104.1 603.8 98.2 609.7 94.1C615.5 89.9 623.8 87.9 634.5 87.9H644.8V83.2C644.8 79.4 643.7 76.3 641.6 74.2C639.4 72 636.3 70.9 632.1 70.9C629.6 70.9 627.4 71.4 625.5 72.2C623.5 73.1 622.1 74.2 621 75.7C620 77.2 619.5 78.8 619.5 80.6H602.5C602.5 76.8 603.7 73.1 606.2 69.7C608.8 66.3 612.4 63.5 617 61.4C621.7 59.4 627 58.3 633 58.3C638.7 58.3 643.7 59.3 648 61.1C652.3 63 655.7 65.8 658.1 69.6C660.5 73.3 661.8 77.9 661.8 83.3V115.3C661.8 121.9 662.7 127.2 664.6 131.1V132.2H647.2C646.5 130.6 645.9 128.4 645.3 125.4C643 127.9 640.2 129.8 637 131.3ZM629.3 120.2C625.7 120.2 622.9 119.3 620.9 117.4C618.9 115.6 617.9 113.2 617.9 110.2C617.9 106.4 619.4 103.5 622.5 101.4C625.5 99.3 630 98.2 635.9 98.2H644.8V111.7C643.5 114.1 641.5 116.1 638.7 117.7C636 119.4 632.8 120.2 629.3 120.2ZM695.8 82.8V132.2H678.8V59.7H695L695.5 67.8C697.3 64.8 699.6 62.5 702.4 60.8C705.2 59.2 708.4 58.3 712 58.3C713 58.3 714.1 58.4 715.3 58.6C716.5 58.8 717.4 59 718 59.2L717.8 75C715.6 74.6 713.3 74.4 711.1 74.4C703.5 74.4 698.4 77.2 695.8 82.8ZM745.2 132.2V108.7L752.6 101.2L774.1 132.2H793.8L763.5 89.8L790.9 59.7H770.4L750.2 82.1L745.2 88.3V29.2H728.3V132.2H745.2ZM851.4 129.6C846.6 132.2 840.8 133.5 834 133.5C826.8 133.5 820.5 132 815.2 128.9C809.8 125.9 805.7 121.7 802.8 116.4C800 111.1 798.5 105.1 798.5 98.5V95.7C798.5 88.3 800 81.7 802.9 76.1C805.8 70.4 809.8 66 814.9 63C820 59.9 825.7 58.3 832.1 58.3C839.1 58.3 844.9 59.8 849.6 62.8C854.4 65.8 857.9 70 860.3 75.4C862.6 80.8 863.8 87 863.8 94.1V101.2H815.7C816 104.9 817 108.2 818.6 111C820.2 113.9 822.5 116.1 825.3 117.7C828 119.3 831.3 120.1 835 120.1C842.7 120.1 848.8 117.2 853.5 111.3L862.5 119.9C859.9 123.8 856.1 127.1 851.4 129.6ZM847 89.1H816C816.8 83.6 818.5 79.3 821.3 76.3C824 73.3 827.6 71.7 832 71.7C837 71.7 840.7 73.2 843.1 76.3C845.5 79.3 846.8 83.1 847 87.8V89.1ZM911 131.9C907.7 133 904 133.5 899.9 133.5C893.9 133.5 889.2 131.9 885.7 128.6C882.3 125.4 880.5 120.2 880.5 113V72H868.5V59.7H880.5V42H897.5V59.7H910.5V72H897.5V111.9C897.5 114.9 898.2 117 899.4 118.1C900.7 119.2 902.6 119.7 905.2 119.7C907 119.7 908.9 119.5 911 119.1V131.9Z" fill="currentColor"/><path d="M136.3 152.5C136.3 159.8 136.3 163.4 133.9 165.2C131.5 167 128 166 121 164L8.6 132.5C4.4 131.3 2.3 130.7 1.1 129.1C-0.1 127.5 -0.1 125.3 -0.1 121V47C-0.1 42.7 -0.1 40.5 1.1 38.9C2.3 37.3 4.4 36.7 8.6 35.5L121 4C128 2 131.5 1 133.9 2.8C136.3 4.6 136.3 8.2 136.3 15.5V152.5ZM27.9 122.2L121 148.3V96.1L27.9 122.2ZM15.2 110.1L108.2 84L15.2 57.9V110.1ZM27.9 45.8L121 71.9V19.7L27.9 45.8Z" fill="currentColor"/></g></g><defs><clipPath id="pm0"><rect width="911" height="168" fill="white"/></clipPath><clipPath id="pm1"><rect width="911" height="168" fill="white"/></clipPath></defs></svg>',
  };
  g1 = definirg1;
  Ac = definirAc;
  b1 = definirb1;
  y1 = definiry1;
  k1 = definirk1;
  w1 = definirw1;
}
function definirCa(t, e) {
  if (!Feed.LIVE || !Feed.json)
    return Oo.data[t] || (window.PREVISAO && window.PREVISAO[t]) || null;
  const n = Date.now();
  return (
    n - (Oo.at[t] || 0) >= e &&
      ((Oo.at[t] = n),
      Feed.json(t + ".json").then(
        (s) => {
          s &&
            s.versao === 1 &&
            ((Oo.data[t] = s), Oo.subs.forEach((a) => a()));
        },
        () => {},
      )),
    Oo.data[t] || null
  );
}
function definiryc(t, e) {
  const n = H(13),
    s = H(22);
  return n && s && Number.isFinite(t) && Number.isFinite(e)
    ? [
        We(Fe({}, n), {
          share: t,
        }),
        We(Fe({}, s), {
          share: e,
        }),
      ]
    : null;
}
function definirkc(t, e, n) {
  const s = Math.pow(10, n),
    a =
      e >= t
        ? Math.round((e / (t + e)) * 100 * s) / s
        : 100 - Math.round((t / (t + e)) * 100 * s) / s;
  return [Math.round((100 - a) * s) / s, a];
}
function definirwc({ l: t, f: e, h: n = 6, band: s = null }) {
  const a = yc(t, e);
  return a
    ? html`<div class="fcbar">
        <${ml}
          a=${a[0]}
          b=${a[1]}
          h=${n}
          fifty
        />${s ? html`<i class="fcband" style=${`left:${s[0]}%;width:${Math.max(0.6, s[1] - s[0])}%`}></i>` : null}
      </div>`
    : null;
}
function definirCc({ l: t, f: e, dec: n = 1, band: s = null, bar: a = !0 }) {
  const r = yc(t, e);
  if (!r) return null;
  const [u, i] = kc(t, e, n);
  return html`<div class="fcbig">
    <div class="fcnums tn">
      <span title=${yt(r[0])}
        ><${an} c=${r[0]} size=${26} round /><b style=${"color:" + kt(r[0])}
          >${ue[n].format(u)}%</b
        ></span
      >
      <span title=${yt(r[1])}
        ><b style=${"color:" + kt(r[1])}>${ue[n].format(i)}%</b
        ><${an} c=${r[1]} size=${26} round
      /></span>
    </div>
    ${a ? html`<${wc} l=${t} f=${e} h=${8} band=${s} />` : null}
  </div>`;
}
function definirm1(t) {
  return t >= 1e6
    ? "US$ " + ue[t >= 1e8 ? 0 : 1].format(t / 1e6) + " mi"
    : t >= 1e3
      ? "US$ " + ue[0].format(t / 1e3) + " mil"
      : "US$ " + ue[0].format(t);
}
function definirWa(t) {
  const e = String(t || "")
    .slice(0, 10)
    .split("-");
  return e.length === 3 ? `${e[2]}/${e[1]}` : "";
}
function definirv1(t) {
  const e = Date.parse(t);
  if (!Number.isFinite(e)) return "";
  const n = new Date(e - 3 * 36e5);
  return `${n.getUTCHours()}:${String(n.getUTCMinutes()).padStart(2, "0")}`;
}
function definirg1(t) {
  const e =
    t && Array.isArray(t.fontes)
      ? t.fontes
          .map((r) => {
            const u = (l) => {
                const d = (r.cands || []).find(($) => +$.n === l);
                return d ? +d.p : NaN;
              },
              i = u(13),
              c = u(22);
            return Number.isFinite(i) && Number.isFinite(c)
              ? {
                  x: r,
                  l: i,
                  f: c,
                }
              : null;
          })
          .filter(Boolean)
      : [];
  if (!e.length) return null;
  const n = H(13),
    s = H(22),
    a = e
      .map((r) => r.x.lido)
      .filter(Boolean)
      .sort()[0];
  return {
    id: "mercados",
    title: "Mercados de previsão",
    top: html`<div class="fch">
      <span><${an} c=${n} size=${22} round />${Wn(n)}</span
      ><span>${Wn(s)}<${an} c=${s} size=${22} round /></span>
    </div>`,
    vis: html`<div class="fcmk">
      ${e.map(({ x: r, l: u, f: i }) => {
        const [c, l] = kc(u, i, 0);
        return html`<div
          class="fcmr"
          key=${r.id}
          title=${r.volume ? m1(r.volume) + " negociados" : r.contratos ? ue[1].format(r.contratos / 1e6) + " mi de contratos" : ""}
        >
          ${
            Mc[r.id]
              ? html`<span
                  class=${"fcsrc logo " + r.id}
                  role="img"
                  aria-label=${r.nome}
                  dangerouslySetInnerHTML=${{
                    __html: Mc[r.id],
                  }}
                ></span>`
              : html`<span class="fcsrc">${r.nome}</span>`
          }
          <div class="fcml">
            <b class="tn" style=${"color:" + kt(n)}>${c}%</b
            ><${wc} l=${u} f=${i} h=${8} /><b
              class="tn r"
              style=${"color:" + kt(s)}
              >${l}%</b
            >
          </div>
        </div>`;
      })}
    </div>`,
    foot: html`<p class="fcfoot">
      Chance de vencer${a ? ", às " + v1(a) : ""}. Não é pesquisa.
    </p>`,
  };
}
function definirAc(t) {
  return Number.isFinite(t.lula_validos) && Number.isFinite(t.flavio_validos)
    ? [t.lula_validos / 100, t.flavio_validos / 100]
    : [t.lula / (t.lula + t.flavio), t.flavio / (t.lula + t.flavio)];
}
function definirb1({ polls: t }) {
  const [e, n] = Ao(),
    s = n.w,
    a = n.h,
    r = H(13),
    u = H(22),
    i = t
      .map((l) => {
        const d = Ac(l);
        return {
          t: Date.parse(l.campo[1]),
          l: d[0],
          f: d[1],
          x: l,
        };
      })
      .filter((l) => Number.isFinite(l.t))
      .sort((l, d) => l.t - d.t);
  let c = null;
  if (s > 40 && a > 24 && i.length && r && u) {
    const l = i[0].t,
      d = Math.max(i[i.length - 1].t, l + 864e5),
      $ = Math.max(0.03, ...i.map((v) => Math.abs(v.f - 0.5))) + 0.008,
      f = (v) => 4 + ((v - l) / (d - l)) * (s - 8),
      m = (v) => 3 + (1 - (v - (0.5 - $)) / (2 * $)) * (a - 6),
      h = (v) => {
        const M = i.filter((S) => S.t <= v && S.t > v - 864e6);
        return M.reduce((S, x) => S + x.f, 0) / M.length;
      },
      g = (v) =>
        i
          .map((M, S) => {
            const x = h(M.t);
            return (
              (S ? "L" : "M") +
              f(M.t).toFixed(1) +
              " " +
              m(v ? 1 - x : x).toFixed(1)
            );
          })
          .join("");
    c = html`<svg
      width=${s}
      height=${a}
      viewBox=${`0 0 ${s} ${a}`}
      role="img"
      aria-label=${`${i.length} pesquisas do 2º turno, de ${Wa(i[0].x.campo[1])} a ${Wa(i[i.length - 1].x.campo[1])}`}
    >
      <line x1="0" x2=${s} y1=${m(0.5)} y2=${m(0.5)} class="fcmid" />
      ${i.map((v, M) => html`<g key=${M} class="fcpt"><title>${v.x.instituto}, ${Wa(v.x.campo[1])}: ${yt(r)} ${_t(v.l)}%, ${yt(u)} ${_t(v.f)}%</title><circle cx=${f(v.t)} cy=${m(v.l)} r="2.4" fill=${nt(r)} /><circle cx=${f(v.t)} cy=${m(v.f)} r="2.4" fill=${nt(u)} /></g>`)}
      <path d=${g(!0)} stroke=${nt(r)} class="fctrend" />
      <path d=${g(!1)} stroke=${nt(u)} class="fctrend" />
    </svg>`;
  }
  return html`<div class="fcchart" ref=${e}>${c}</div>`;
}
function definiry1(t) {
  if (!t) return null;
  const e = (Array.isArray(t.pesquisas) ? t.pesquisas : []).filter(
    (c) =>
      c &&
      Number.isFinite(c.lula) &&
      Number.isFinite(c.flavio) &&
      Array.isArray(c.campo) &&
      typeof c.campo[1] == "string",
  );
  if (!e.length)
    return {
      id: "pesquisas",
      title: "Pesquisas",
      vis: html`<p class="fcwait">
        Ainda sem pesquisas do 2º turno registradas no TSE.
      </p>`,
    };
  const n = e.reduce((c, l) => (l.campo[1] > c ? l.campo[1] : c), ""),
    s = new Date(Date.parse(n) - 21 * 864e5).toISOString().slice(0, 10),
    a = Object.values(
      e
        .filter((c) => c.campo[1] >= s)
        .reduce((c, l) => {
          const d = l.instituto;
          return ((!c[d] || l.campo[1] > c[d].campo[1]) && (c[d] = l), c);
        }, {}),
    ),
    r = a
      .map(Ac)
      .reduce(
        (c, l) => [c[0] + l[0] / a.length, c[1] + l[1] / a.length],
        [0, 0],
      ),
    u = e.reduce((c, l) => (l.campo[1] < c ? l.campo[1] : c), n),
    i = new Set(e.map((c) => c.instituto)).size;
  return {
    id: "pesquisas",
    title: "Pesquisas",
    top: html`<${Cc} l=${r[0]} f=${r[1]} dec=${1} bar=${!1} />`,
    vis: html`<${b1} polls=${e} />`,
    foot: html`<p class="fcfoot fcax tn">
      <span>${Wa(u)}</span><span>${e.length} pesquisas de ${i} institutos</span
      ><span>${Wa(n)}</span>
    </p>`,
  };
}
function definirk1({ d: t }) {
  const [e, n] = Ao(),
    s = n.w,
    a = n.h,
    r = H(13),
    u = H(22),
    i = t.distribuicao;
  let c = null;
  if (podeDesenharDistribuicao(a, i, r, s, u)) {
    const l = i.contagens.length,
      d = i.de,
      $ = d + l * i.passo,
      f = Math.max(...i.contagens),
      m = 15,
      h = a - m,
      g = (z) => ((z - d) / ($ - d)) * s,
      v = (z) => h - (z / f) * (h - 2),
      M = s / l,
      S =
        t.intervalo80 && Array.isArray(t.intervalo80.flavio)
          ? t.intervalo80.flavio
          : [d, $],
      x = t.flavio,
      w = (z) =>
        html`<text x=${g(z)} y=${a - 3} text-anchor="middle"
          >${ue[0].format(z)}%</text
        >`;
    c = html`<svg
      width=${s}
      height=${a}
      viewBox=${`0 0 ${s} ${a}`}
      role="img"
      aria-label=${`Projeção: ${yt(u)} ${_t(x / 100)}%, em 8 de cada 10 cenários entre ${_t(S[0] / 100, 0)}% e ${_t(S[1] / 100, 0)}%`}
    >
      ${i.contagens.map((z, gt) => {
        const _ = d + gt * i.passo,
          j = _ + i.passo / 2;
        return z
          ? html`<rect
              key=${gt}
              x=${g(_) + 0.4}
              y=${v(z)}
              width=${Math.max(0.6, M - 0.8)}
              height=${h - v(z)}
              rx="1"
              fill=${nt(j < 50 ? r : u)}
              opacity=${j >= S[0] && j <= S[1] ? 0.95 : 0.3}
            />`
          : null;
      })}
      ${d < 50 && $ > 50 ? html`<line x1=${g(50)} x2=${g(50)} y1="0" y2=${h} class="fc50" />` : null}
      <line x1=${g(x)} x2=${g(x)} y1="0" y2=${h} class="fcmedl" />
      <g class="fcticks">
        ${d < 50 && $ > 50 ? w(50) : null}${w(Math.ceil(d))}${w(Math.floor($))}
      </g>
    </svg>`;
  }
  return html`<div class="fcchart pj" ref=${e}>${c}</div>`;
}
function definirw1(t, e = !1) {
  if (!t || !Number.isFinite(t.flavio) || !Number.isFinite(t.lula)) return null;
  const n = (s) => (s > 1 ? s / 100 : s);
  return {
    id: "projecao",
    title: "Projeção histórica",
    top: html`<${Cc} l=${n(t.lula)} f=${n(t.flavio)} dec=${1} bar=${!1} />`,
    vis: html`<${k1} d=${t} />`,
    foot: html`<p class="fcfoot">
      ${e ? "Modelo histórico, " : ""}${ue[0].format(t.simulacoes || 2e4)}
      cenários. ${e ? "Não" : "Estimativa, não"} é pesquisa.<button
        class="fcinfo"
        type="button"
        title=${t.metodo || ""}
        aria-label=${"Como é feita: " + (t.metodo || "")}
      >
        i
      </button>
    </p>`,
  };
}
