import {
  useRef,
  Sn,
  html,
  yt,
  Ee,
  Xt,
  pt,
  wn,
  useState,
  useEffect,
  useLayoutEffect,
  nt,
  _t,
  Cn,
  mt,
  ct,
  rt,
  Pe,
  kt,
} from "./formatacao-e-acessibilidade-1.js";
import {
  an,
  oo,
  os,
  Io,
  Po,
  Lo,
  yi,
  Mi,
  ml,
  hl,
} from "./candidatos-e-partidos-1.js";
import { Pa, p, ss, aa, ha, Xn, No, Co, Ie } from "./apuracao-e-votos-1.js";
import { tn } from "./contagem-e-animacao-1.js";
import { Vl, Lc } from "./atualizacoes-1.js";
import { ja } from "./resultados-e-listas-1.js";
import { Wo } from "./composicao-legislativa-1.js";
import { Xs, wr } from "./paineis-e-projecoes-1.js";
import { Ho, mo } from "./hud-e-comunicacao-1.js";
export let Nl, E1;
export function initialize() {
  Nl = PainelResultadosEstado;
  E1 = LinhaZonaEleitoral;
}
function PainelResultadosEstado({
  m: t,
  uf: e,
  office: n = "pres",
  tv: s = !1,
  onClose: a,
  onStep: r,
  scroll: u = !1,
  spot: i = null,
}) {
  const c = t.ufs[e],
    l = c.gov && c.gov.length ? c.gov : null,
    d = c.sen && c.sen.length ? c.sen : null,
    $ = semVotosEstaduais(c),
    f = c.pst >= 1,
    m = s,
    h = useRef(null),
    g = Sn && Sn.gov && Sn.gov[e],
    v = Sn && Sn.sen && Sn.sen[e],
    M = (W) =>
      html`<div class="seat1 was1" key=${W.id || W.n}>
        <${an} c=${W} size=${28} round />
        <div style="min-width:0">
          <div class="nm">${yt(W)}</div>
          <${oo} c=${W} />
        </div>
        <span class="tn sv">${Ee(W.share)}</span>
      </div>`,
    S = l ? null : Pa(e),
    x = renderEleitosPrimeiroTurno(s, S, M, v);
  wn(h, e);
  const [w, z] = useState(null);
  useEffect(() => z(null), [e, n]);
  const gt = useRef(null),
    [_, j] = useState(0),
    Y = [
      e,
      n,
      c.govStatus,
      c.senStatus,
      $,
      innerWidth,
      innerHeight,
      i ? i.office + i.id : "",
    ].join(),
    E = useRef("");
  useLayoutEffect(() => {
    const W = gt.current;
    if (!W || u || s || w) return;
    const ze = () => {
        const sn = W.getBoundingClientRect(),
          Xe = sn.height / (W.offsetHeight || 1) || 1;
        let De = -1 / 0;
        for (const xo of W.children) {
          const ds = xo.getBoundingClientRect();
          ds.height > 0 && (De = Math.max(De, ds.bottom));
        }
        return (De - sn.bottom) / Xe > -14;
      },
      Pn = (sn) => {
        for (let Xe = 1; Xe <= 8; Xe++)
          W.classList.toggle("tr" + Xe, !!((sn >> (Xe - 1)) & 1));
        return sn;
      },
      dn = E.current !== Y;
    E.current = Y;
    let In = dn ? Pn(0) : _;
    for (let sn = 1; sn <= 8 && ze(); sn++) In = Pn(In | (1 << (sn - 1)));
    if (dn)
      for (let sn = 7; sn >= 1; sn--) {
        const Xe = 1 << (sn - 1);
        In & Xe && (Pn(In & ~Xe), ze() ? Pn(In) : (In &= ~Xe));
      }
    In !== _ && j(In);
  });
  const T = l && p(c, "gov").sort(ss),
    Ct = d && p(c, "sen").sort(ss),
    xt = d && c.senStatus,
    Bt = (W) => (i && i.office === W ? i.id : null),
    ve = (W) => "lab" + (Bt(W) ? " on" : ""),
    Ke = (W, ze, Pn) => {
      const dn =
        Bt(W) && !Pn.some((In) => In.id === Bt(W))
          ? ze.find((In) => In.id === Bt(W))
          : null;
      return dn
        ? html`<${os} key=${"s" + dn.id} c=${dn} size=${30} cls="spot" />`
        : null;
    },
    we = (W, ze) =>
      html`<div
        class=${"seat1" + (W.id === Bt("sen") ? " spot" : "") + Io(W)}
        key=${W.id}
        ...${Po(W)}
      >
        <${an} c=${W} size=${32} round />
        <div style="min-width:0">
          <div class="nm">${yt(W)}</div>
          <${oo} c=${W} />
        </div>
        ${ze ? html`<span class="chip done"><i></i>${pt(W) ? "Eleita" : "Eleito"}</span>` : $ ? null : html`<span class="tn sv"><${tn} n=${W.share} fmt=${Ee} /></span>`}
      </div>`,
    Ae = l
      ? renderDisputaGovernador(ve, c, l, $, T, m, Bt, g, f, Ke, s, z)
      : null,
    D = renderDisputaSenado(d, ve, xt, $, we, Ct, m, Bt, Ke, e, s, z),
    q = selecionarListaCompleta(w, l, d, $, c),
    le = renderListaCompleta(q, w, z, $),
    be = renderPresidenteEstado(ve, e, $, c, Bt, Ke, s, z),
    ot = renderIndicadoresEstado($, c),
    ke = ordenarSecoesEstado(s, n, Ae, D, be, x, ot);
  return renderCartaoEstado(n, m, u, s, w, _, e, gt, h, c, r, a, $, le, ke);
}
function LinhaZonaEleitoral({ x: t, on: e, onPick: n, zlink: s }) {
  const a = t.race && t.race[0],
    r = t.f > 0 && !!a && a.votes > 0,
    u = r ? rt(a.partido) : null,
    i = s
      ? {
          onMouseEnter: () => s(t.j),
          onMouseLeave: () => s(null),
          onFocus: () => s(t.j),
          onBlur: () => s(null),
        }
      : {};
  return renderLinhaZonaEleitoral(e, t, n, r, a, i, u);
}
function renderDisputaGovernador(ve, c, l, $, T, m, Bt, g, f, Ke, s, z) {
  return html`<section class="sec-gov" key="g">
    <div class=${ve("gov")}>
      <span>Governador</span
      >${c.govStatus !== "apurando" ? html`<${Lo} status=${c.govStatus} cands=${[l[0]]} />` : null}
    </div>
    ${
      $
        ? html`<${yi} list=${l} />`
        : html`<${Mi}
              a=${T[0]}
              b=${T[1]}
              size=${m ? 64 : 40}
              spot=${Bt("gov")}
            /><${ml} a=${T[0]} b=${T[1]} h=${m ? 6 : 4} fifty />
            ${
              g && g.top[1]
                ? html`<p
                    class="then t1 tn"
                    title="O resultado do 1º turno, em 4 de outubro"
                  >
                    <span>1º turno</span>${T.map((W) => {
                      const ze = g.top.find((Pn) => +Pn.n == +W.n);
                      return ze
                        ? html`<span key=${W.id}
                            ><i style=${"background:" + nt(W)}></i
                            >${_t(ze.share)}%</span
                          >`
                        : null;
                    })}
                  </p>`
                : null
            }
            <${Vl} list=${l} none=${$} /><${Lc}
              cells=${
                f && l.length > 2
                  ? [
                      ["Vantagem", Math.abs(T[0].votes - T[1].votes), Cn],
                      [
                        `Outras ${l.length - 2} candidaturas`,
                        l.slice(2).reduce((W, ze) => W + ze.share, 0),
                        Ee,
                      ],
                    ]
                  : [
                      ["Vantagem", Math.abs(T[0].votes - T[1].votes), Cn],
                      f
                        ? ["Falta apurar", "Nenhum"]
                        : ["Falta apurar", c.left, mt],
                    ]
              }
            />`
    }${Ke("gov", l, T)}${!s && !$ && l.length > 2 ? html`<button class="allc" onClick=${() => z("gov")}>Todos os ${l.length} candidatos</button>` : null}
  </section>`;
}
function renderCartaoEstado(n, m, u, s, w, _, e, gt, h, c, r, a, $, le, ke) {
  return html`<section
    class=${
      "card grow stc hasnav enter lead-" +
      n +
      (m ? " big" : "") +
      (u ? " pcard scroll" : s ? "" : w ? " all" : " fit") +
      [1, 2, 3, 4, 5, 6, 7, 8]
        .filter((W) => (_ >> (W - 1)) & 1)
        .map((W) => " tr" + W)
        .join("")
    }
    key=${e}
    ref=${gt}
  >
    <div class="sh">
      <${hl} uf=${e} size=${40} />
      <div>
        <h2 tabindex="-1" ref=${h}>${c.name}</h2>
        <div class="sub sub2 tn">
          <span>${c.uf}</span><span>${mt(c.el)}</span>
        </div>
      </div>
      <div class="x tvhide">
        <button
          class="icon"
          aria-label="Estado anterior"
          onClick=${() => r(-1)}
        >
          <${Ho} d=${-1} /></button
        ><button class="icon" aria-label="Próximo estado" onClick=${() => r(1)}>
          <${Ho} d=${1} /></button
        ><button class="icon" aria-label="Fechar o estado" onClick=${a}>
          <${mo} />
        </button>
      </div>
    </div>
    ${c.pst == null ? html`<p class="note">${c.available === false ? "Dados estaduais indisponíveis nesta atualização." : "Cobertura municipal incompleta · percentual estadual indisponível."}</p>` : $ ? html`<p class="note">Nenhuma seção totalizada ainda.</p>` : html`<${wr} r=${c} small />`}
    ${c.aggregation === "municipal" ? html`<p class="note">Soma dos municípios recebidos${c.coverage ? ` · ${c.coverage.available} de ${c.coverage.expected} municípios` : ""}.</p>` : null}
    ${le || ke}
  </section>`;
}
function renderLinhaZonaEleitoral(e, t, n, r, a, i, u) {
  return html`<button
    class=${"krow zrow" + (e ? " on" : "")}
    data-k=${"z" + t.z}
    aria-pressed=${e}
    onClick=${() => n && n(t.j)}
    aria-label=${`Zona ${t.z}${t.nome ? ", " + t.nome : ""}${t.bare ? ", sem área no mapa" : ""}: ${t.f == null ? "carregando" : r ? `${yt(a)} ${_t(a.share)}%, ${Pe(t.f)}% das seções` : "aguardando"}`}
    ...${i}
  >
    <span
      class="uft zt"
      style=${r ? `--bg:${u.cor};--fg:${u.on}` : "--bg:#2A2825;--fg:#8C8A84"}
      >${t.z}</span
    >
    <span class="kn"
      ><span class="nm" title=${t.nome || null}>${t.nome || "Zona " + t.z}</span
      ><small class="tn"
        >${t.nome ? t.z + "ª zona · " : ""}${t.bare ? "sem área no mapa" : mt(t.el)}</small
      ></span
    >
    <span class="kv"
      >${t.f == null ? html`<small>carregando</small>` : r ? html`<${an} c=${a} size=${22} round /><b class="tn" style=${"color:" + kt(a)}><${tn} n=${a.share} fmt=${Ee} /></b>` : html`<small>aguardando</small>`}</span
    >
    <span class="rbar"
      ><i style=${`width:${Math.round((t.f || 0) * 100)}%`}></i
    ></span>
  </button>`;
}
function renderEleitosPrimeiroTurno(s, S, M, v) {
  return Xt === 2 && !s
    ? html`${
        S
          ? html`<section class="sec-t1" key="g1">
              <div class="lab">
                <span>Governador</span
                ><span class="chip done"
                  ><i></i>${pt(S) ? "Eleita" : "Eleito"} no 1º turno</span
                >
              </div>
              ${M(S)}
            </section>`
          : null
      }
      ${
        v && v.length
          ? html`<section class="sec-t1" key="s1">
              <div class="lab">
                <span>Senado</span
                ><span class="chip done"
                  ><i></i>${v.every(pt) ? "Eleitas" : "Eleitos"} no
                  1º turno</span
                >
              </div>
              ${v.slice(0, 2).map(M)}
            </section>`
          : null
      }`
    : null;
}
function renderDisputaSenado(d, ve, xt, $, we, Ct, m, Bt, Ke, e, s, z) {
  return d
    ? html`<section class="sec-sen" key="s">
        <div class=${ve("sen")}>
          <span>Senado · duas vagas</span
          >${xt !== "apurando" ? html`<${Lo} status=${xt} cands=${xt === "eleitos" ? d.slice(0, 2) : [d[0]]} />` : null}
        </div>
        ${
          $
            ? html`<${yi} list=${d} />`
            : xt === "eleitos"
              ? html`${we(d[0], !0)}${we(d[1], !0)}`
              : html`${we(d[0], xt === "um-eleito")}${
                  $
                    ? null
                    : html`<div class="seatlab">2ª vaga</div>
                        <${Mi}
                          a=${Ct[0]}
                          b=${Ct[1]}
                          size=${m ? 56 : 36}
                          spot=${Bt("sen")}
                        /><${ml} a=${Ct[0]} b=${Ct[1]} h=${m ? 6 : 4} />
                        <${Lc}
                          cells=${[["Vantagem na 2ª vaga", Math.abs(Ct[0].votes - Ct[1].votes), Cn], null]}
                        />`
                }`
        }${Ke("sen", d, xt === "eleitos" ? d.slice(0, 2) : [d[0], ...Ct])}
        <${Vl}
          list=${d}
          none=${$}
        />${ja[e] ? html`<p class="note stays">No cargo até 2031: ${ja[e][0]} (${Wo(ja[e][1])})</p>` : null}${!s && !$ && d.length > 3 ? html`<button class="allc" onClick=${() => z("sen")}>Todos os ${d.length} candidatos</button>` : null}
      </section>`
    : null;
}
function selecionarListaCompleta(w, l, d, $, c) {
  return w === "gov" ? l : w === "sen" ? d : w === "pres" && !$ ? c.pres : null;
}
function renderListaCompleta(q, w, z, $) {
  return q
    ? html`<section class="sec-all" key="all">
        <div class="lab">
          <span
            >${w === "gov" ? "Governador" : w === "sen" ? "Senado" : "Presidente"}
            · ${q.length} candidatos</span
          ><button class="lnk" onClick=${() => z(null)}>Voltar</button>
        </div>
        ${q.filter((W) => !W.anulado).map((W) => html`<${os} key=${W.id} c=${W} size=${28} votes />`)}<${Vl}
          list=${q}
          none=${$}
        />
      </section>`
    : null;
}
function renderPresidenteEstado(ve, e, $, c, Bt, Ke, s, z) {
  return html`<section class="sec-pres" key="p">
    <div class=${ve("pres")}><span>Presidente ${ct(e)}</span></div>
    ${c.voteDestinationWarning && !$ ? html`<p class="note">Percentuais calculados sobre votos computados das candidaturas. Destinações especiais podem diferir dos votos válidos.</p>` : null}
    ${$ ? null : c.pres.slice(0, 3).map((W, ze) => html`<${os} key=${W.id} c=${W} size=${30} cls=${(ze > 1 ? "xmid" : "") + (W.id === Bt("pres") ? " spot" : "")} />`)}${$ ? null : Ke("pres", c.pres, c.pres.slice(0, 3))}${!s && !$ && c.pres.length > 3 ? html`<button class="allc" onClick=${() => z("pres")}>Todos os ${c.pres.length} candidatos</button>` : null}${Xt === 2 ? html`<${aa} s=${ha(e)} />` : null}${Xn ? html`<${No} w=${Co(Ie.uf[e])} />` : null}
  </section>`;
}
function renderIndicadoresEstado($, c) {
  return $ ||
    !(c.elDone > 0) ||
    !(c.votes > 0) ||
    c.blank == null ||
    c.nul == null
    ? null
    : html`<section class="xtall" key="k">
        <div class="kpis">
          <${Xs}
            k="Comparecimento"
            n=${c.elDone ? c.votes / c.elDone : 0}
            fmt=${Ee}
          /><${Xs}
            k="Brancos"
            n=${c.votes ? c.blank / c.votes : 0}
            fmt=${Ee}
          /><${Xs} k="Nulos" n=${c.votes ? c.nul / c.votes : 0} fmt=${Ee} />
        </div>
      </section>`;
}
function ordenarSecoesEstado(s, n, Ae, D, be, x, ot) {
  return s
    ? [(n === "gov" ? Ae : n === "sen" ? D : null) || be]
    : n === "gov"
      ? [Ae, D, be, x, ot]
      : n === "sen"
        ? [D, Ae, be, x, ot]
        : [be, Ae, D, x, ot];
}

function semVotosEstaduais(c) {
  return c.available === false || !(c.base > 0);
}
