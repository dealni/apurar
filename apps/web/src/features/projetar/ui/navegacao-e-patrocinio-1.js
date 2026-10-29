import {
  renderMenuDoSite,
  renderFonteDoTopo,
  renderAcoesDoTopo,
  rotuloDoAtalhoDeBusca,
  renderSeletorDeCargo,
  renderProgressoDoTopo,
  renderBuscaNoTelefone,
  renderAudienciaNoTopo,
  renderSimulacaoNoTopo,
  renderBuscaNoDesktop,
} from "./shell-topo-render.js";
import { Oc, sd } from "./busca-e-preferencias-1.js";
import {
  html,
  useState,
  useEffect,
  ue,
  ht,
  ie,
  kt,
  yt,
  nt,
  rt,
  _t,
  es,
} from "./formatacao-e-acessibilidade-1.js";
import { mr, vr, vl, Io, Po, an, oo } from "./candidatos-e-partidos-1.js";
import { Da, kr } from "./paineis-e-projecoes-1.js";
import { tn } from "./contagem-e-animacao-1.js";
import { ss } from "./apuracao-e-votos-1.js";
import { kl } from "./mapa-dados-1.js";
import { Za } from "./candidatos-e-partidos-2.js";
export let Ul,
  Rc,
  ad,
  ld,
  rd,
  jl,
  Zs,
  Zc,
  Gl,
  Wl,
  id,
  cd,
  Dc,
  ud,
  dd,
  Vc,
  fd,
  pd,
  $d;
export function initialize() {
  Ul = shellUl;
  Rc = shellRc;
  ad = shellad;
  ld = !!(window.CSS && CSS.supports && CSS.supports("zoom", "2"));
  rd =
    (navigator.deviceMemory || 4) >= 8
      ? 84e5
      : (navigator.deviceMemory || 4) >= 4
        ? 5e6
        : 26e5;
  jl = shelljl;
  Zs = 20;
  Zc = 72;
  Gl = 20;
  Wl = 44;
  id = 336;
  cd = 308;
  Dc = !!(window.APURACAO && window.APURACAO.shell);
  ud = {
    mapa: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0zM15 5.764v15M9 3.236v15",
    explorar: "M21 21l-4.34-4.34M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
    resultados: "M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3",
  };
  dd = shelldd;
  Vc = [
    ["mapa", "Mapa"],
    ["explorar", "Explorar"],
    ["resultados", "Resultados"],
  ];
  fd = shellfd;
  pd = shellpd;
  $d = shell$d;
}
function shellUl({
  m: t,
  t: e,
  live: n,
  conn: s,
  office: a,
  setOffice: r,
  onTV: u,
  onSearch: i,
  onExit: c,
  cam: l = !1,
  onCam: d = null,
  onShare: $,
  about: f,
  setAbout: m,
  tv: h,
  phone: g,
  abroad: v = !1,
  onAbroad: M = null,
  onBrasil: S = null,
  apurTop: _ = !0,
  find: j = !0,
  connectionStatus = true,
  sourceStatus = null,
  headerClass = "",
  statusClass = "",
  shareLabel = "Compartilhar",
}) {
  const Y = n ? (s ? s.estado : "sim") : "replay",
    E = !!Oc[Y],
    T = !E && (Y === "conectando" || t.empty),
    Ct = Y === "replay" ? "Como estava às " : E ? Oc[Y] : "Atualizado às ",
    xt = mr(),
    Bt = n && t.at > e ? t.at : e,
    ve =
      h || !j
        ? null
        : html`<button
            type="button"
            class="sbtn"
            onClick=${i}
            aria-label=${
              a === "gov"
                ? "Buscar município ou estado"
                : v
                  ? "Buscar município, estado, país, cidade do exterior ou candidato"
                  : "Buscar município, estado ou candidato"
            }
            aria-haspopup="dialog"
          >
            <${vr} /><span>Buscar</span><kbd>${rotuloDoAtalhoDeBusca()}</kbd>
          </button>`;
  return html`<header
    class=${["hudtop", "clean-header", headerClass].filter(Boolean).join(" ")}
  >
    <div class="brand">
      <a class="site-brand-link" href="/" aria-label="Apurar, apuração"
        ><img
          class="apurar-wordmark"
          src="/brand/apurar-logo-horizontal-inverse.svg"
          width="126"
          height="31"
          alt="Apurar" /></a
      >${renderMenuDoSite()}
    </div>
    ${renderSeletorDeCargo({
      g,
      a,
      r,
      h,
      t,
    })}${renderProgressoDoTopo({
      h,
      _,
      t,
    })}
    ${renderBuscaNoTelefone({
      g,
      ve,
    })}
    <div class=${["status", statusClass].filter(Boolean).join(" ")}>
      ${renderFonteDoTopo({ g, h, sourceStatus, connectionStatus, T, E, Y, Ct, Bt })}
      ${renderAudienciaNoTopo({
        g,
        xt,
      })}
      ${renderSimulacaoNoTopo({
        f,
        m,
      })}${renderBuscaNoDesktop({
        g,
        ve,
      })}${renderAcoesDoTopo({ g, h, M, v, S, $, shareLabel: shareLabel, d, l, c, u })}
    </div>
    ${f ? html`<${sd} onClose=${() => m(!1)} />` : null}
  </header>`;
}
function shellRc() {
  return {
    W: Math.max(1, innerWidth || 0),
    H: Math.max(1, innerHeight || 0),
  };
}
function shellad() {
  const [t, e] = useState(Rc);
  return (
    useEffect(() => {
      let n = 0;
      const s = () => {
        n ||
          (n = requestAnimationFrame(() => {
            n = 0;
            const a = Rc();
            e((r) => (r.W === a.W && r.H === a.H ? r : a));
          }));
      };
      return (
        addEventListener("resize", s),
        addEventListener("orientationchange", s),
        s(),
        () => {
          (removeEventListener("resize", s),
            removeEventListener("orientationchange", s),
            cancelAnimationFrame(n));
        }
      );
    }, []),
    t
  );
}
function shelljl(t, e, n) {
  return Math.max(1, Math.min(4, n, Math.sqrt(rd / Math.max(1, t * e))));
}
function shelldd({ k: t, on: e }) {
  return html`<svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d=${ud[t]}
      fill="none"
      stroke="currentColor"
      stroke-width=${e ? 2.2 : 1.8}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`;
}
function shellfd({ tab: t, setTab: e, dot: n = !1 }) {
  return html`<nav class="tabbar" aria-label="Seções">
    ${Vc.map(
      ([s, a]) =>
        html`<button
          type="button"
          key=${s}
          class=${t === s ? "on" : ""}
          aria-current=${t === s ? "page" : null}
          onClick=${() => e(s)}
        >
          <span class="tbi"
            ><${dd}
              k=${s}
              on=${t === s}
            />${n && s === "ultimas" && t !== s ? html`<i class="dot"></i>` : null}</span
          ><span>${a}</span>
        </button>`,
    )}
  </nav>`;
}
function shellpd(t) {
  return t >= 1e6
    ? ue[1].format(Math.round(t / 1e5) / 10) + " mi"
    : t >= 1e4
      ? ue[0].format(Math.round(t / 1e3)) + " mil"
      : ht(t);
}
function shell$d({ m: t, compact: e = !1 }) {
  const n = t.n,
    s = t.pres[0],
    a = t.pres[1],
    [r, u] = [s, a].sort(ss),
    i = (n.base ?? n.valid) > 0,
    c = ie(n.pst || 0, 0, 1),
    l = vl(t),
    d = (h) => html`<b style=${"color:" + kt(h)}>${yt(h)}</b>`,
    $ = (h) => (kl(nt(h), "#FAFAF9") >= 3 ? "#FAFAF9" : rt(h.partido).on),
    f = (h, g) => {
      const v = i ? ie(h.share, 0, 1) : 0,
        M =
          i && v >= 0.14
            ? html`<b class="tn" key="f"
                ><${tn} n=${h.share} fmt=${(w) => _t(w, 1)} /><small
                  >%</small
                ></b
              >`
            : null,
        S =
          e && i && v >= 0.3
            ? html`<span class="rbp-n" key="n">${es(h)}</span>`
            : null,
        x =
          !e && i && v >= 0.38
            ? html`<span class="rb-v tn" key="v"
                ><${tn} n=${h.votes} fmt=${pd}
              /></span>`
            : null;
      return html`<i
        class=${g ? "r" : "l"}
        style=${`width:${v * 100}%;background:${nt(h)};color:${$(h)}`}
        >${g ? [x, M, S] : [S, M, x]}</i
      >`;
    },
    m = (h, g) =>
      html`<div class=${"rbp-c" + (g ? " r" : "") + Io(h)} ...${Po(h)}>
        <${an} c=${h} size=${36} />
        <div class="rbp-nm"><b>${es(h)}</b><${oo} c=${h} /></div>
      </div>`;
  return html`<section
    class=${"rbp" + (e ? " compact" : "")}
    aria-label="Presidente"
  >
    ${
      e
        ? null
        : html`<h2 class="rbp-head" key=${l}>${Za(t, d)}</h2>
            <div class="rbp-who">${m(r)}${m(u, !0)}</div>`
    }
    <div
      class="rb-bar rbp-bar"
      role="img"
      aria-label=${i ? `${yt(r)} ${_t(r.share, 2)}%, ${yt(u)} ${_t(u.share, 2)}% dos votos ${n.voteDestinationWarning ? "computados das candidaturas" : "válidos"}; vence quem passa de 50%` : "Nenhum voto apurado ainda"}
    >
      <div class="rb-track">
        ${f(r)}${f(u, !0)}${i && !e && r.share + u.share > 0.995 ? html`<span class="rb-fire" style=${"left:" + ie(r.share, 0, 1) * 100 + "%"} aria-hidden="true"></span>` : null}
      </div>
      <span class="rb-50"></span>
    </div>
    ${n.voteDestinationWarning ? html`<p class="note">Percentuais calculados sobre votos computados das candidaturas. Destinações especiais podem diferir dos votos válidos.</p>` : null}
    <div class="rbp-foot">
      <i class="rb-foot" aria-hidden="true"
        ><i style=${"width:" + c * 100 + "%"}></i
      ></i>
      <span
        class="rb-apl tn"
        style=${"--p:" + c}
        role="progressbar"
        aria-label="Seções totalizadas"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${Math.floor(c * 1e3) / 10}
        ><b><${tn} n=${c} fmt=${Da} /></b>
        totalizado${c >= 1 || !(n.left >= 1) ? null : html`<span class="rb-left">· <${tn} n=${n.left} fmt=${kr} /></span>`}</span
      >
    </div>
  </section>`;
}
