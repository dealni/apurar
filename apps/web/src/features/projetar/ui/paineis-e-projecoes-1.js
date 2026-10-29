import { FaixaDisputa } from "./resultado-faixa-disputa.js";
import { renderizarResumoDaProjecao } from "./resultado-projecao-resumo.js";
import { montarIndicadoresDaDisputa } from "./resultado-projecao-indicadores.js";
import { renderizarResultadoPresidencial } from "./resultado-projecao-presidencial.js";
import {
  html,
  Te,
  ht,
  useState,
  useEffect,
  kt,
  yt,
  useRef,
  useLayoutEffect,
  Vt,
  Cn,
  lt,
  mt,
  _t,
  nt,
  ue,
  Ue,
  ie,
  rt,
  Xt,
  Dt,
  pe,
} from "./formatacao-e-acessibilidade-1.js";
import { Ai, Za } from "./candidatos-e-partidos-2.js";
import { ss, tt, ae } from "./apuracao-e-votos-1.js";
import { vl, os, Oa, Io, Po, an, oo } from "./candidatos-e-partidos-1.js";
import { tn, Bo } from "./contagem-e-animacao-1.js";
import { kl, Cl } from "./mapa-dados-1.js";
export let Eu, Si, xi, br, Ei, yr, Da, kr, wr, Xs, _u, zu;
export function initialize() {
  Eu = definirEu;
  Si = definirSi;
  xi = definirxi;
  br = definirbr;
  Ei = definirEi;
  yr = definiryr;
  Da = definirDa;
  kr = definirkr;
  wr = definirwr;
  Xs = definirXs;
  _u = definiru;
  zu = definirzu;
}
function definirEu(t) {
  return !!(t && t.n && !t.empty && t.n.status !== "apurando");
}
function definirSi() {
  return html`<i class="livedot" aria-hidden="true"></i>`;
}
function definirxi(t) {
  return t.length > 3
    ? `${t.length} estados`
    : t.length === 1
      ? Te[t[0]] || t[0]
      : t.slice(0, -1).join(", ") + " e " + t[t.length - 1];
}
function definirbr(t) {
  const e = Ai(t),
    n = [];
  return (e.gov.length && n.push(["gov", "Governadores", xi(e.gov)]), n);
}
function definirEi({ m: t, onNext: e }) {
  const s = br(t);
  return s.length
    ? html`<div class="nxt">
        <div class="nxt-lab">Ainda em apuração</div>
        ${s.map(([a, r, u]) => html`<button key=${a} type="button" class="nxt-row" onClick=${() => e(a)}><${Si} /><b>${r}</b><span>${u}</span><i class="nxt-go" aria-hidden="true">→</i></button>`)}
      </div>`
    : null;
}
function definiryr({
  m: t,
  compact: e = !1,
  spot: n = null,
  onNext: s = null,
  tv: a = !1,
  slim: r = !1,
}) {
  const u = t.n,
    i = t.pres[0],
    c = t.pres[1],
    l = [i, c].sort(ss),
    d = 2,
    $ = vl(t),
    f = u.status !== "apurando",
    m = (q) => html`<b style=${"color:" + kt(q)}>${yt(q)}</b>`,
    h = t.pres.slice(2),
    g = h.slice(0, 3),
    v = h.slice(3),
    M = n && n.office === "pres" ? n.id : null,
    S = M ? v.find((q) => q.id === M) : null,
    x = S ? v.filter((q) => q !== S) : v,
    w = renderizarSpot(S),
    [z, gt] = useState(null),
    _ = useRef({
      kind: $,
      m: t,
    });
  (useLayoutEffect(() => {
    if (_.current.kind === $) return;
    gt(_.current);
    const q = setTimeout(() => gt(null), 220);
    return () => clearTimeout(q);
  }, [$]),
    useEffect(() => {
      _.current = {
        kind: $,
        m: t,
      };
    }));
  const [j, Y] = useState(!1),
    E = useRef(null),
    [T, Ct] = useState(!0),
    xt = () => {
      const q = E.current;
      q && Ct(q.scrollTop + q.clientHeight >= q.scrollHeight - 2);
    };
  useLayoutEffect(() => {
    j && xt();
  }, [j]);
  if (t.empty) return renderizarAguardandoDados();
  const Bt = Vt(t),
    ve = $.startsWith("lead:"),
    Ke = [i.share - c.share, (q) => Oa(q, d) + " · " + Cn(i.votes - c.votes)],
    we = montarIndicadoresDaDisputa(Ke, f, u, ve);
  if (!((u.base ?? u.valid) > 0))
    return html`<section class="card hero enter pre" aria-label="Presidente">
      <div class="kick"><span>Brasil</span></div>
      ${r ? null : html`<div class="sentbox"><h2 class="sent" key=${$}>${Za(t, m)}</h2></div>`}
      ${
        r
          ? null
          : html`<div class="prefield">
              ${lt
                .slice()
                .sort(ss)
                .map(
                  (q) =>
                    html`<div key=${q.id} class=${Io(q).trim()} ...${Po(q)}>
                      <${an} c=${q} size=${48} round /><${oo} c=${q} />
                    </div>`,
                )}
            </div>`
      }
      <div class="kv">
        <div><span>Candidaturas</span><b class="tn">${lt.length}</b></div>
        <div><span>Eleitorado</span><b class="tn">${mt(u.el)}</b></div>
      </div>
      ${renderizarResumoDaProjecao(Bt, t.pres, t.projection?.reason)}
    </section>`;
  const Ae = t.pres.filter((q) => !q.anulado);
  if (j)
    return html`<section
      class="card hero all enter"
      aria-label="Candidaturas a Presidente"
    >
      <div class="kick">
        <span>Brasil · ${Ae.length} candidatos</span
        ><button class="lnk" type="button" onClick=${() => Y(!1)}>
          Voltar
        </button>
      </div>
      <div class=${"allp" + (T ? "" : " over")} ref=${E} onScroll=${xt}>
        ${Ae.map((q) => html`<${os} key=${q.id} c=${q} size=${28} votes cls=${q.id === M ? "spot" : ""} />`)}
      </div>
    </section>`;
  const D =
    !a && !e && Ae.length > 2
      ? html`<button class="allc" type="button" onClick=${() => Y(!0)}>
          Todos os ${Ae.length} candidatos
        </button>`
      : null;
  return renderizarResultadoPresidencial(
    $,
    Bt,
    D,
    M,
    a,
    d,
    e,
    f,
    g,
    h,
    i,
    l,
    m,
    r,
    s,
    t,
    u,
    w,
    we,
    x,
    z,
  );
}
function definirDa(t) {
  return (
    (t >= 1 ? "100" : t > 0 ? ue[2].format(Math.floor(t * 1e4) / 100) : "0") +
    "%"
  );
}
function definirkr(t) {
  return "faltam " + (t >= 1e4 ? Ue(t) : mt(t));
}
function definirwr({ r: t, small: e = !1, tv: n = !1 }) {
  const s = ie(t.pst || 0, 0, 1);
  return html`<div
    class=${"apur" + (e ? " apur-sm" : "") + (n ? " apur-tv" : "")}
  >
    <div class="ah">
      <b class="tn"><${tn} n=${s} fmt=${Da} /></b>
      <div class="al">
        <span>seções totalizadas</span
        ><small class="tn"
          >${t.left == null ? "" : s >= 1 || !(t.left >= 1) ? "nada a totalizar" : html`<${tn} n=${t.left} fmt=${kr} />`}</small
        >
      </div>
    </div>
    <div
      class="ab"
      role="progressbar"
      aria-label="Seções totalizadas"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${Math.floor(s * 1e3) / 10}
      title=${t.sections ? ht(t.secDone) + " de " + ht(t.sections) + " seções" : null}
    >
      <i style=${"width:" + s * 100 + "%"}></i>
    </div>
  </div>`;
}
function definirXs({ k: t, v: e, n, fmt: s, still: a = !1 }) {
  return html`<div class="kpi">
    <div class="k">${t}</div>
    <div class="v">
      ${s ? html`<${tn} n=${n} fmt=${s} />` : html`<${Bo} v=${e} still=${a} />`}
    </div>
  </div>`;
}
function definiru({ m: t }) {
  if (t.empty)
    return html`<section
      class="card rbanner rbanner-empty"
      aria-label="Presidente"
    >
      <div aria-hidden="true"></div>
      <div class="rb-mid">
        <h2 class="rb-head">Aguardando dados oficiais</h2>
        <p class="note">
          Os resultados aparecem quando uma publicação oficial estiver
          disponível.
        </p>
      </div>
      <div aria-hidden="true"></div>
    </section>`;
  return html`<${FaixaDisputa} m=${t} />`;
}

function renderizarSpot(candidate) {
  return candidate
    ? html`<${os}
        key=${"s" + candidate.id}
        c=${candidate}
        size=${28}
        cls="spot"
      />`
    : null;
}
function renderizarAguardandoDados() {
  return html`<section class="card hero enter pre" aria-label="Presidente">
    <div class="kick"><span>Brasil</span></div>
    <div class="sentbox"><h2 class="sent">Aguardando dados oficiais</h2></div>
    <p class="note">
      Os resultados aparecem quando uma publicação oficial estiver disponível.
    </p>
  </section>`;
}
function definirzu(t) {
  const e = Xt === 2 && t.towns ? Cl() : null;
  return e
    ? tt
        .filter(
          (n) =>
            Dt(t, n) >= 0.5 &&
            Number.isFinite(e.br[n * 2]) &&
            e.br[n * 2] !== e.br[n * 2 + 1] &&
            (e.br[n * 2] > e.br[n * 2 + 1] ? 0 : 1) !== pe(t, n),
        )
        .sort((n, s) => ae[s] - ae[n])
    : null;
}
