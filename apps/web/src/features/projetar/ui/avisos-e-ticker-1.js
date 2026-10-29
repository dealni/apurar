import { legacyTerritoryDetailsEnabled } from "../territory-details.js";
import {
  html,
  hn,
  lt,
  us,
  kt,
  yt,
  Pe,
  pt,
  Cn,
  _t,
  useRef,
  vt,
  useState,
  useEffect,
  useLayoutEffect,
  ge,
  Te,
  X,
  mt,
  ht,
  Nt,
} from "./formatacao-e-acessibilidade-1.js";
import { an, oo, Ci } from "./candidatos-e-partidos-1.js";
import { Sc } from "./regioes-1.js";
import { Sim } from "../simulation.js";
import { ss, Fn, ae, qt } from "./apuracao-e-votos-1.js";
import { ll, Is } from "./eventos-e-progresso-1.js";
import { tn } from "./contagem-e-animacao-1.js";
import { bc } from "./historico-e-graficos-1.js";
import { Feed } from "../feed.js";
import { Hs, zc } from "./atualizacoes-1.js";
import { So } from "./hud-e-comunicacao-1.js";
import { Or } from "./mapa-geometria-2.js";
import { Geo } from "../geography.js";
import { zt } from "./municipios-e-distritos-2.js";
export let B1, H1, U1, j1, W1, K1, Fc, Yn;
export const G1State = {
  value: undefined,
};
export const aoState = {
  value: undefined,
};
export const XaState = {
  value: undefined,
};
export function initialize() {
  B1 = shellB1;
  H1 = {
    N: "no Norte",
    NE: "no Nordeste",
    CO: "no Centro-Oeste",
    SE: "no Sudeste",
    S: "no Sul",
  };
  U1 = shellU1;
  j1 = shellj1;
  G1State.value = 0;
  W1 = shellW1;
  aoState.value = null;
  K1 = shellK1;
  XaState.value = null;
  Fc = shellFc;
  Yn = {
    list: null,
    at: 0,
    subs: new Set(),
  };
}
function shellB1({ e: t, x: e, y: n, w: s, out: a, onClose: r }) {
  return html`<button
    class=${"toast" + (a ? " out" : "")}
    style=${`left:${e}px;top:${n}px;max-width:${s}px`}
    aria-label="Fechar o aviso"
    onClick=${r}
  >
    <span class="avs"
      ><${an}
        c=${t.cand}
        size=${28}
        round
      />${t.cand2 ? html`<${an} c=${t.cand2} size=${28} round />` : null}</span
    >
    <p>${(t.short || t.line)()} · <time class="tn">${hn(t.t)}</time></p>
  </button>`;
}
function shellU1(t) {
  let e = null;
  for (const [n] of Sc) {
    const s = Sim.UFS.filter((u) => Sim.REGION[u] === n),
      a = lt.map(() => 0);
    let r = 0;
    for (const u of s) {
      const i = t.ufs[u];
      ((r += i.left), i.pres.forEach((c) => (a[c.k] += c.votes)));
    }
    (!e || r > e.left) &&
      (e = {
        at: H1[n],
        left: r,
        lead: lt[a.indexOf(Math.max(...a))],
      });
  }
  return e && e.left > 0 ? e : null;
}
function shellj1({ e: t, m: e }) {
  const n = e.pres[0],
    s = e.pres[1],
    a = [n, s].sort(ss),
    r = us(n.share, s.share),
    u = (m) => html`<b style=${"color:" + kt(m)}>${yt(m)}</b>`,
    i = Fn.find((m) => m.t === t.t),
    c = Pe(t.big !== "virada" && i ? i.pst : e.n.pst),
    l =
      (t.big === "virada"
        ? "Virada"
        : t.big === "eleito"
          ? "Eleição definida"
          : "2º turno") +
      " · " +
      hn(t.t),
    d =
      t.big === "virada"
        ? html`${u(lt[t.v.to])} passa à frente de ${yt(lt[t.v.from])}`
        : t.big === "eleito"
          ? html`${u(n)} é ${pt(n) ? "eleita" : "eleito"} presidente${ll}`
          : html`${u(n)} e ${u(s)} vão ao 2º turno`,
    $ = t.big === "virada" ? U1(e) : null,
    f =
      t.big === "virada"
        ? `Com ${c}% das seções totalizadas, ${yt(n)} tem ${Cn(n.votes - s.votes)} a mais.${$ ? ` Falta apurar mais ${$.at}, onde ${yt($.lead)} lidera.` : ""}`
        : t.big === "eleito"
          ? `Com ${c}% das seções totalizadas, nenhum voto que falta tira a maioria.`
          : `Com ${c}% das seções totalizadas, ninguém pode mais passar de 50% dos válidos.`;
  return html`<section class="card hero evcard">
    <div class="kick">Presidente · ${l}</div>
    <div>
      <h2 class="sent">${d}</h2>
      <p class="evsub">${f}</p>
    </div>
    <div class="leaders">
      ${a.map(
        (m, h) =>
          html`<div
            class=${"leader" + (h ? " r" : "")}
            key=${m.id}
            style=${"grid-column:" + (h ? 3 : 1)}
          >
            <${an} c=${m} size=${96} />
            <div class="nm">${yt(m)}</div>
            <${oo} c=${m} />
            <div class="fig">
              <${tn} n=${m.share} fmt=${(g) => _t(g, r)} /><sup
                style=${"color:" + kt(m)}
                >%</sup
              >
            </div>
          </div>`,
      )}
      <div class="evplot chart" key="plot">
        <${bc} m=${e} W=${340} H=${170} draw />
      </div>
    </div>
    <${Ci} left=${a[0]} right=${a[1]} h=${10} done=${t.big !== "virada"} />
  </section>`;
}
function shellW1({ t, style: e }) {
  const n = useRef(t);
  n.current = t;
  const s = (g) =>
      Is.filter((v) => (Feed.LIVE && !vt.on) || v.t <= n.current).slice(-g),
    a = (g) =>
      g.map((v) => ({
        e: v,
        uid: G1State.value++,
      })),
    [r, u] = useState(() => a(s(4))),
    i = useRef(null);
  i.current ||
    (i.current = new Set(
      Is.filter((g) => (Feed.LIVE && !vt.on) || g.t <= t).map(Hs),
    ));
  const c = useRef(null),
    l = useRef(null),
    d = useRef(24),
    $ = useRef(0),
    f = useRef(!1);
  useEffect(() => {
    const g = Is.filter(
      (x) => ((Feed.LIVE && !vt.on) || x.t <= t) && !i.current.has(Hs(x)),
    );
    if (!g.length) return;
    g.forEach((x) => i.current.add(Hs(x)));
    const v = l.current,
      M = c.current;
    let S = 0;
    if (v && M)
      for (const x of v.children)
        if (x.offsetLeft - v.offsetLeft + d.current < M.clientWidth) S++;
        else break;
    u((x) => [...x.slice(0, S), ...[...x.slice(S), ...a(g)].slice(-5)]);
  }, [t]);
  const m = useRef({
    first: 0,
    track: 0,
    win: 0,
  });
  (useLayoutEffect(() => {
    ((d.current += $.current), ($.current = 0), (f.current = !1));
    const g = l.current,
      v = c.current;
    (g &&
      v &&
      (m.current = {
        first: g.firstElementChild ? g.firstElementChild.offsetWidth : 0,
        track: g.offsetWidth,
        win: v.clientWidth,
      }),
      g && !ge && (g.style.transform = `translateX(${d.current}px)`));
  }, [r]),
    useEffect(() => {
      if (ge) return;
      let g,
        v = performance.now();
      const M = (S) => {
        const x = Math.min(0.1, (S - v) / 1e3),
          w = l.current,
          z = c.current;
        if (((v = S), w && z)) {
          ((d.current -= 46 * x),
            (w.style.transform = `translateX(${d.current}px)`));
          const gt = m.current.first;
          gt && !$.current && -d.current > gt
            ? (($.current = gt), u((_) => _.slice(1)))
            : !f.current &&
              m.current.track + d.current < m.current.win * 1.5 &&
              ((f.current = !0), u((_) => [..._, ...a(s(6))]));
        }
        g = requestAnimationFrame(M);
      };
      return ((g = requestAnimationFrame(M)), () => cancelAnimationFrame(g));
    }, []));
  const h = ge
    ? s(6)
        .reverse()
        .map((g) => ({
          e: g,
          uid: Hs(g),
        }))
    : r;
  return h.length
    ? html`<div class="ticker" style=${e}>
        <span class="tklab">Últimas</span>
        <div class="tkwin" ref=${c}>
          <div class="tktrack" ref=${l}>
            ${h.map(
              ({ e: g, uid: v }) =>
                html`<span class="tk" key=${v}
                  ><time>${hn(g.shown != null ? g.shown : g.t)}</time
                  >${g.cand ? html`<${an} c=${g.cand} size=${24} round />` : g.ms ? html`<${zc} p=${g.ms} size=${22} />` : g.zz ? html`<span class="evg"><${So} size=${14} /></span>` : null}<span
                    >${(g.tick || g.line)()}</span
                  ></span
                >`,
            )}
          </div>
        </div>
      </div>`
    : null;
}
function shellK1() {
  if (aoState.value) {
    for (const item of aoState.value)
      if (item.t === "town")
        item.sub = "Município · " + mt(Feed.town(item.i)?.eleitorado ?? null);
    aoState.value = aoState.value
      .filter((item) => item.t !== "cand")
      .concat(candidatosDaBusca());
    return aoState.value;
  }
  aoState.value = [];
  const t = {
      3106200: ["bh"],
      3550308: ["sampa"],
      5300108: ["bsb"],
      4314902: ["poa"],
      4205407: ["floripa"],
    },
    e = new Set(Or);
  for (const n of Sim.UFS)
    aoState.value.push({
      t: "uf",
      uf: n,
      label: Te[n],
      sub: "Estado",
      key: X(Te[n]),
      alias: [n.toLowerCase()],
      w: 3,
    });
  if (
    (Geo.munis.forEach((n, s) =>
      aoState.value.push({
        t: "town",
        i: s,
        uf: n.uf,
        label: n.name,
        sub: "Município · " + mt(Feed.town(s)?.eleitorado ?? null),
        key: X(n.name),
        alias: e.has(s) ? [n.uf.toLowerCase(), ...(t[n.id] || [])] : null,
        w: 1 + Math.log10(Math.max(10, n.pop)) / 10,
        pop: n.pop,
      }),
    ),
    zt)
  ) {
    aoState.value.push({
      t: "zz",
      uf: "ZZ",
      label: "Exterior",
      sub: "Presidente · resultado agregado oficial",
      key: "exterior",
      alias: ["zz", "fora do brasil", "fora do pais", "internacional", "mundo"],
      w: 2.8,
    });
    for (const n of zt.countries)
      aoState.value.push({
        t: "country",
        uf: "ZZ",
        iso: n.iso,
        label: n.name,
        sub: "Exterior · resultado oficial por país",
        unavailable: new URLSearchParams(location.search).get("demo") === "1",
        key: X(n.name),
        w: 1.5 + Math.log10(n.el + 10) / 10,
      });
    for (const n of zt.cities)
      aoState.value.push({
        t: "city",
        uf: "ZZ",
        i: n.i,
        iso: n.iso,
        label: n.name,
        sub: `Exterior · ${n.country} · resultado oficial por cidade`,
        unavailable: new URLSearchParams(location.search).get("demo") === "1",
        key: X(n.name),
        w: 1.1 + Math.log10(n.el + 10) / 10,
        el: n.el,
      });
  }
  aoState.value.push(...candidatosDaBusca());
  return aoState.value;
}
function candidatosDaBusca() {
  const items = [];
  for (const n of lt)
    items.push({
      t: "cand",
      c: n,
      office: "pres",
      label: yt(n),
      sub: "Presidência · " + Nt(n),
      key: X(yt(n)),
      w: 2.6,
    });
  for (const n of Sim.UFS) {
    const s = Sim.RACES[n];
    for (const a of s.gov)
      items.push({
        t: "cand",
        c: a,
        office: "gov",
        uf: n,
        label: yt(a),
        sub: `Governo · ${Nt(a)} · ${Te[n]}`,
        key: X(yt(a)),
        w: 2,
      });
    for (const a of s.sen)
      items.push({
        t: "cand",
        c: a,
        office: "sen",
        uf: n,
        label: yt(a),
        sub: `Senado · ${Nt(a)} · ${Te[n]}`,
        key: X(yt(a)),
        w: 1.8,
      });
  }
  return items;
}
function shellFc() {
  if (!legacyTerritoryDetailsEnabled()) return [];
  if (XaState.value || !window.ZONAS || !window.ZONAS.m)
    return XaState.value || [];
  XaState.value = [];
  for (const t in window.ZONAS.m) {
    const e = qt.get(t),
      n = window.ZONAS.m[t];
    if (e == null) continue;
    const s = Geo.munis[e];
    n.z.forEach((a, r) =>
      XaState.value.push({
        t: "zone",
        i: e,
        z: +a,
        uf: s.uf,
        town: X(s.name),
        label: n.nome[r] || "Zona " + a,
        sub: `${a}ª zona · ${s.name}, ${s.uf} · resultado oficial ou aguardando publicação`,
        unavailable: new URLSearchParams(location.search).get("demo") === "1",
        key: X(n.nome[r] || ""),
        w: 1 + Math.log10(Math.max(10, n.el[r])) / 10,
      }),
    );
  }
  return XaState.value;
}
