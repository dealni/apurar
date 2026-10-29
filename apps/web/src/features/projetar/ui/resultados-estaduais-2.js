import {
  useRef,
  useEffect,
  ge,
  useState,
  html,
  rt,
  yt,
  _t,
  Nt,
  mt,
  kt,
  Ee,
  ht,
} from "./formatacao-e-acessibilidade-1.js";
import { wt } from "./municipios-e-distritos-1.js";
import { We, Fe } from "../object-helpers.js";
import { Ao } from "./contagem-e-animacao-1.js";
import { Xo } from "./resultados-municipais-1.js";
import { Ho } from "./hud-e-comunicacao-1.js";
import { E1 } from "./resultados-estaduais-1.js";
import { an } from "./candidatos-e-partidos-1.js";
import { $e } from "./municipios-e-distritos-2.js";
export let Pc, _1, z1, Ic, T1;
export function initialize() {
  Pc = useRolagemRecorte;
  _1 = ListaZonasEleitorais;
  z1 = LinhaBairro;
  Ic = normalizarBuscaBairro;
  T1 = ListaBairros;
}
function useRolagemRecorte(t, e, n) {
  const s = useRef(null);
  useEffect(() => {
    const a = n && t.current && t.current.closest(".pcard");
    if (!a) return;
    if (a.closest(".hud.flow")) {
      const u = e != null && a.querySelector(".zsec");
      if (u) {
        const i = u.getBoundingClientRect();
        rolarRecorteVisivel(i);
      }
      return;
    }
    if (e == null) {
      s.current &&
        ((a.scrollTop = s.current[0] - (s.current[1] - a.scrollHeight)),
        (s.current = null));
      return;
    }
    const r = a.querySelector(".zsec");
    if (r) {
      const u = r.getBoundingClientRect(),
        i = a.getBoundingClientRect();
      (u.top < i.top + 8 || u.bottom > i.bottom - 32) &&
        (s.current || (s.current = [a.scrollTop, a.scrollHeight]),
        (a.scrollTop += u.top - i.top - 12));
    }
  }, [e, n]);
}
function ListaZonasEleitorais({
  m: t,
  i: e,
  zone: n = null,
  onZone: s = null,
  zlink: a = null,
  scroll: r = !1,
}) {
  return html`<section class="kgrow zl tvhide">
    <div class="lab"><span>Zonas eleitorais e bairros</span></div>
    <p class="note zn">
      Apuração por zona e bairro indisponível. O cadastro geográfico de
      referência não representa os resultados oficiais desta eleição.
    </p>
  </section>`;
}
function LinhaBairro({ x: t, on: e, onPick: n }) {
  const s = t.list[0],
    a = !!s && s.votes > 0,
    r = a ? rt(s.partido) : null;
  return html`<button
    class=${"krow zrow" + (e ? " on" : "")}
    aria-pressed=${e}
    onClick=${() => n && n(t.b)}
    aria-label=${`${t.name}: ${a ? `${yt(s)} ${_t(s.share)}%` : "aguardando"}, ${t.n} ${t.n === 1 ? "local de votação" : "locais de votação"}`}
  >
    <span
      class="uft zt"
      style=${a ? `--bg:${r.cor};--fg:${r.on}` : "--bg:#2A2825;--fg:#8C8A84"}
      >${a ? Nt(s) : "–"}</span
    >
    <span class="kn"
      ><span class="nm" title=${t.name}>${t.name}</span
      ><small class="tn"
        >${t.n} ${t.n === 1 ? "local" : "locais"} · ${mt(t.el)}</small
      ></span
    >
    <span class="kv"
      >${a ? html`<${an} c=${s} size=${22} round /><b class="tn" style=${"color:" + kt(s)}>${Ee(s.share)}</b>` : html`<small>aguardando</small>`}</span
    >
  </button>`;
}
function normalizarBuscaBairro(t) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function ListaBairros({
  m: t,
  i: e,
  L: n,
  bairro: s = null,
  onBairro: a = null,
  scroll: r = !1,
}) {
  const u = $e(t, e, n).map((_, j) =>
      Fe(
        {
          b: j,
          name: n.bairros[j],
        },
        _,
      ),
    ),
    [i, c] = useState(""),
    [l, d] = useState(20),
    [$, f] = Ao(),
    [m, h] = useState(0),
    g = useRef(null),
    v = i.trim() ? u.filter((_) => Ic(_.name).includes(Ic(i.trim()))) : u,
    M = u.length > 12,
    S = Math.max(2, Math.floor((f.h || Xo * 4) / Xo)),
    x = Math.max(1, Math.ceil(v.length / S)),
    w = Math.min(Math.floor(m / S), x - 1),
    z = (_) => h(_ * S);
  (useEffect(() => {
    (h(0), c(""), d(20));
  }, [e]),
    useEffect(() => {
      const _ = v.findIndex((j) => j.b === s);
      _ >= 0 && h(_);
    }, [s]),
    Pc(g, s, r));
  const gt = r ? v.slice(0, l) : v.slice(w * S, w * S + S);
  return renderListaBairros(
    g,
    n,
    r,
    u,
    w,
    z,
    x,
    M,
    i,
    c,
    h,
    d,
    $,
    f,
    gt,
    s,
    a,
    v,
    l,
  );
}
function rolarRecorteVisivel(i) {
  return (
    (i.top < 70 || i.bottom > innerHeight - 24) &&
    scrollTo({
      top: Math.max(0, scrollY + i.top - 76),
      behavior: ge ? "auto" : "smooth",
    })
  );
}
function renderListaBairros(
  g,
  n,
  r,
  u,
  w,
  z,
  x,
  M,
  i,
  c,
  h,
  d,
  $,
  f,
  gt,
  s,
  a,
  v,
  l,
) {
  return html`<section class="kgrow zl tvhide" ref=${g}>
    <div class="lab">
      <span
        >${n.div && n.div.fonte === "distritos" ? "Distritos" : "Bairros"}</span
      >${renderPaginacaoBairros(r, u, n, w, z, x)}
    </div>
    ${
      M
        ? html`<div class="dfilt bfind">
            <input
              type="search"
              value=${i}
              placeholder=${"Buscar entre " + ht(u.length) + (n.div && n.div.fonte === "distritos" ? " distritos" : " bairros")}
              aria-label="Buscar um bairro pelo nome"
              onInput=${(_) => {
                (c(_.target.value), h(0), d(20));
              }}
            />
          </div>`
        : null
    }
    <div class="klist" ref=${$}>
      ${f.h || r ? gt.map((_) => html`<${z1} key=${_.b} x=${_} on=${s === _.b} onPick=${a} />`) : null}${v.length ? null : html`<p class="note">Nenhum bairro com esse nome.</p>`}
    </div>
    ${r && v.length > l ? html`<button type="button" class="dmore" onClick=${() => d((_) => _ + 40)}>Mostrar mais ${Math.min(40, v.length - l)} · faltam ${ht(v.length - l)}</button>` : null}
    <p class="note zn">
      Cada ponto é um local de votação, do tamanho do seu eleitorado.
      ${n.div ? (n.div.fonte === "distritos" ? "Distritos" : "Bairros") + " do IBGE." : "Bairros como o TSE registra."}
    </p>
  </section>`;
}
function renderPaginacaoBairros(r, u, n, w, z, x) {
  return r
    ? html`<span class="aside tn"
        >${u.length}
        ${n.div && n.div.fonte === "distritos" ? "distritos" : "bairros"}</span
      >`
    : html`<div class="pager">
        <button
          class="icon"
          aria-label="Bairros anteriores"
          disabled=${w === 0}
          onClick=${() => z(w - 1)}
        >
          <${Ho} d=${-1} /></button
        ><span>${w + 1}/${x}</span
        ><button
          class="icon"
          aria-label="Próximos bairros"
          disabled=${w >= x - 1}
          onClick=${() => z(w + 1)}
        >
          <${Ho} d=${1} />
        </button>
      </div>`;
}
