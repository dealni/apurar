import { vo, L1 } from "./resultados-estaduais-3.js";
import { Feed } from "../feed.js";
import {
  Xt,
  useState,
  useRef,
  useEffect,
  wn,
  html,
  Te,
  mt,
  ht,
  vt,
  Ee,
  rt,
  yt,
  _t,
  Pe,
  kt,
  un,
  Ue,
  Oe,
} from "./formatacao-e-acessibilidade-1.js";
import { Geo } from "../geography.js";
import { Sim } from "../simulation.js";
import { We, Fe, ei } from "../object-helpers.js";
import { hl, Lo, os, an } from "./candidatos-e-partidos-1.js";
import { ae, Nn, $a, bn, so, Xn, Ie, No, Co } from "./apuracao-e-votos-1.js";
import { xc, Vl } from "./atualizacoes-1.js";
import { mo, bu } from "./hud-e-comunicacao-1.js";
import { Xs } from "./paineis-e-projecoes-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { tn, Ao } from "./contagem-e-animacao-1.js";
export let loadMunicipalityResult,
  MunicipalityResult,
  ql,
  Ma,
  Bl,
  I1,
  F1,
  Xo,
  O1,
  R1,
  Z1;
export function initialize() {
  loadMunicipalityResult = carregarResultadoMunicipal;
  MunicipalityResult = PainelResultadoMunicipal;
  ql = SelecionarPainelMunicipio;
  Ma = formatarHoraLocal;
  Bl = resumirUrnasExterior;
  I1 = horarioFechamentoPais;
  F1 = statusUrnasExterior;
  Xo = 50;
  O1 = LinhaPaisExterior;
  R1 = LinhaCidadeExterior;
  Z1 = PainelExterior;
}
function carregarResultadoMunicipal(t) {
  const e = Date.now(),
    n = () => vo.subs.forEach((s) => s());
  return (
    e - (vo.at[t] || 0) > Feed.every(3e4) &&
      ((vo.at[t] = e),
      Feed.json(`cidade/${t}${Xt === 2 ? "-2t" : ""}.json`).then(
        (s) => {
          (s && s.versao === 1 && s.votos
            ? ((vo.data[t] = s), (vo.bad[t] = !1))
            : (vo.bad[t] = !0),
            n());
        },
        () => {
          ((vo.bad[t] = !0), n());
        },
      )),
    vo.data[t] || null
  );
}
function PainelResultadoMunicipal({
  i: t,
  office: e,
  onClose: n,
  onState: s,
  scroll: a = !1,
}) {
  const r = Geo.munis[t],
    u = r.id + "-" + e,
    [, i] = useState(0),
    c = useRef(null);
  (useEffect(() => {
    const S = () => i((w) => w + 1);
    (vo.subs.add(S), loadMunicipalityResult(u));
    const x = 0;
    return () => {
      (vo.subs.delete(S), clearInterval(x));
    };
  }, [u]),
    wn(c, t));
  const l = loadMunicipalityResult(u),
    d = Sim.RACES[r.uf] || {
      gov: [],
      sen: [],
    },
    $ = e === "gov" ? d.gov : d.sen,
    f = (l && l.anulados) || {},
    m = new Set((l && Array.isArray(l.sj) && l.sj) || []),
    h = l
      ? Object.values(l.votos).reduce((S, x) => S + (+x || 0), 0) +
        [...m].reduce((S, x) => S + (+f[x] || 0), 0)
      : 0,
    g = l
      ? $.map((S) => {
          const x = String(S.n) in f,
            w = x && m.has(String(S.n)),
            z = +((x ? f[S.n] : l.votos[S.n]) || 0);
          return We(Fe({}, S), {
            anulado: x,
            sj: w,
            votes: z,
            share: (x && !w) || !h ? 0 : z / h,
          });
        }).sort((S, x) => x.votes - S.votes || +S.n - +x.n)
      : [],
    v = l && l.secoes ? l.totalizadas / l.secoes : 0,
    M = l ? l.apurado || l.eleitorado : 0;
  return renderCartaoResultadoMunicipal(a, t, e, s, r, c, l, n, v, u, h, g, M);
}
function SelecionarPainelMunicipio(n) {
  var s = n,
    { office: t = "pres" } = s,
    e = ei(s, ["office"]);
  return Feed.LIVE && (t === "gov" || t === "sen")
    ? html`<${MunicipalityResult}
        i=${e.i}
        office=${t}
        onClose=${e.onClose}
        onState=${e.onState}
        scroll=${e.scroll}
      />`
    : html`<${L1} ...${e} />`;
}
function formatarHoraLocal(t) {
  const e = ((Math.round(t) % 1440) + 1440) % 1440,
    n = Math.floor(e / 60),
    s = e % 60;
  return n + ":" + String(s).padStart(2, "0");
}
function resumirUrnasExterior(t, e = null) {
  let n = 0,
    s = 0,
    a = 0,
    r = 0;
  const u = new Map();
  for (const i of e || Nn) {
    const c = zt.cities[i];
    if ((r++, (a += c.el), c.closes <= t)) (n++, (s += c.el));
    else {
      const l = u.get(c.iso) || {
        name: c.country,
        el: 0,
        ate: 0,
      };
      ((l.el += c.el), (l.ate = Math.max(l.ate, c.closes)), u.set(c.iso, l));
    }
  }
  return {
    n,
    el: s,
    all: a,
    total: r,
    open: [...u.values()].sort((i, c) => c.el - i.el),
  };
}
function horarioFechamentoPais(t) {
  return Math.max(...t.cities.map((e) => zt.cities[e].closes));
}
function statusUrnasExterior(t, e, n) {
  return t >= 1
    ? "apurado"
    : t > 0
      ? "apurando"
      : e >= n
        ? "urnas fechadas"
        : "vota até " + Ma(n);
}
function LinhaPaisExterior({ m: t, k: e, onPick: n }) {
  const { race: s, pst: a } = $a(t, e),
    r = s[0],
    u = a > 0 && !!r && r.votes > 0,
    i = u ? rt(r.partido) : null,
    c = F1(a, t.t, I1(e));
  return html`<button
    class="krow"
    data-k=${e.iso}
    onClick=${() => n(e.iso)}
    aria-label=${`${e.name}: ${u ? `${yt(r)} ${_t(r.share)}%` : c}, ${Pe(a)}% das seções`}
  >
    <span
      class="uft"
      style=${u ? `--bg:${i.cor};--fg:${i.on}` : "--bg:#2A2825;--fg:#8C8A84"}
      >${e.iso}</span
    >
    <span class="kn"
      ><span class="nm">${e.name}</span
      ><small class="tn"
        >${e.n > 1 ? e.n + " cidades · " : ""}${mt(e.el)}</small
      ></span
    >
    <span class="kv"
      >${u ? html`<${an} c=${r} size=${22} round /><b class="tn" style=${"color:" + kt(r)}><${tn} n=${r.share} fmt=${Ee} /></b>` : html`<small>${c}</small>`}</span
    >
    <span class="rbar"><i style=${`width:${Math.round(a * 100)}%`}></i></span>
  </button>`;
}
function LinhaCidadeExterior({ m: t, i: e, onPick: n }) {
  const s = zt.cities[e],
    a = bn(t, e),
    r = so(t, e) || [],
    u = r[0],
    i = a > 0 && !!u && u.votes > 0,
    c = s.closes <= t.t,
    l =
      a >= 1
        ? "apurado"
        : a > 0
          ? "apurando"
          : c
            ? "urnas fechadas"
            : "votando";
  return html`<button
    class="krow"
    data-k=${"x" + e}
    onClick=${() => n(e)}
    aria-label=${`${s.name}: ${i ? `${yt(u)} ${_t(u.share)}%` : l}, as urnas ${c ? "fecharam" : "fecham"} às ${Ma(s.closes)}`}
  >
    <span class="uft plain">${s.iso}</span>
    <span class="kn"
      ><span class="nm">${s.name}</span
      ><small class="tn"
        >${c ? "fechou" : "fecha"} às ${Ma(s.closes)} · ${mt(s.el)}</small
      ></span
    >
    <span class="kv"
      >${i ? html`<${an} c=${u} size=${22} round /><b class="tn" style=${"color:" + kt(u)}><${tn} n=${u.share} fmt=${Ee} /></b>` : html`<small>${l}</small>`}</span
    >
    <span class="rbar"><i style=${`width:${Math.round(a * 100)}%`}></i></span>
  </button>`;
}
function PainelExterior({
  m: t,
  onCountry: e,
  onClose: n,
  tv: s = !1,
  scroll: a = !1,
  spot: r = null,
}) {
  const u = t.ufs.ZZ,
    i = u.pst <= 0,
    c = useRef(null),
    [l, d] = Ao();
  wn(c, "ZZ");
  const $ = Math.max(3, Math.floor((d.h || Xo * 4) / Xo)),
    f = zt.countries.slice(0, a ? 8 : $);
  return renderCartaoExterior(s, a, c, u, n, i, t, r, l, d, f, e);
}
function renderCartaoExterior(s, a, c, u, n, i, t, r, l, d, f, e) {
  return html`<section
    class=${"card grow stc ext enter" + (s ? " big" : "") + (a ? " pcard scroll" : "")}
    key="ZZ"
  >
    <div class="sh">
      <${bu} size=${40} />
      <div>
        <h2 tabindex="-1" ref=${c}>Exterior</h2>
        <div class="sub sub2 tn">
          <span><${tn} n=${u.pst} fmt=${un} /> das seções</span
          ><span>${mt(u.el)}</span>
        </div>
      </div>
      <div class="x tvhide">
        <button class="icon" aria-label="Fechar o exterior" onClick=${n}>
          <${mo} />
        </button>
      </div>
    </div>
    <section>
      <div class="lab">
        <span>Presidente no exterior</span
        >${u.pst >= 1 ? html`<${Lo} status="apurado" />` : null}
      </div>
      ${
        i
          ? html`<p class="note">
              ${u.available === false ? "Dados do exterior indisponíveis nesta atualização." : "Nenhuma seção totalizada ainda."}
            </p>`
          : u.pres
              .slice(0, 3)
              .map(
                (m) =>
                  html`<${os}
                    key=${m.id}
                    c=${m}
                    size=${30}
                    cls=${r && r.office === "pres" && r.id === m.id ? "spot" : ""}
                  />`,
              )
      }
      ${Xn && Ie.uf.ZZ ? html`<${No} w=${Co(Ie.uf.ZZ)} />` : null}
    </section>
    ${
      s
        ? null
        : html`<section class="kgrow">
            <div class="lab"><span>Por país</span></div>
            <p class="note">
              Selecione um país no mapa ou na lista para consultar os resultados
              oficiais por país e cidade, com o horário próprio da fonte.
            </p>
          </section>`
    }
  </section>`;
}
function renderCartaoResultadoMunicipal(a, t, e, s, r, c, l, n, v, u, h, g, M) {
  return html`<section
    class=${"card grow stc enter" + (a ? " pcard scroll" : " all")}
    key=${"c" + t + e}
  >
    <button
      class="upto tvhide"
      onClick=${s}
      aria-label=${"Voltar para " + Te[r.uf]}
    >
      ‹ ${Te[r.uf]}
    </button>
    <div class="sh">
      <${hl} uf=${r.uf} size=${40} />
      <div>
        <h2 tabindex="-1" ref=${c}>${r.name}</h2>
        <div class="sub sub2 tn">
          <span>${r.uf}</span><span>${mt(l?.eleitorado ?? null)}</span>
        </div>
      </div>
      <div class="x tvhide">
        <${xc} i=${t} /><button
          class="icon"
          aria-label="Fechar o município"
          onClick=${n}
        >
          <${mo} />
        </button>
      </div>
    </div>
    <section>
      <div class="lab">
        <span>${e === "gov" ? "Governador" : "Senado"} em ${r.name}</span
        >${l && v >= 1 ? html`<${Lo} status="apurado" />` : null}
      </div>
      <p class="note tn">${renderStatusResultadoMunicipal(l, u)}</p>
      ${l && h > 0 ? g.filter((S) => !S.anulado).map((S) => html`<${os} key=${S.id} c=${S} size=${30} bar votes />`) : l ? html`<p class="note">Nenhuma seção totalizada ainda nesta cidade.</p>` : null}
      ${l && h > 0 ? html`<${Vl} list=${g} none=${!1} />` : null}
    </section>
    ${
      l && l.comparecimento > 0 && M > 0
        ? html`<section class="tvhide">
            <div
              class="kpis"
              style="grid-template-columns:repeat(3,minmax(0,1fr))"
            >
              <${Xs}
                k="Comparecimento"
                n=${Math.min(1, l.comparecimento / M)}
                fmt=${Ee}
              /><${Xs}
                k="Brancos"
                n=${l.brancos / l.comparecimento}
                fmt=${Ee}
              /><${Xs} k="Nulos" n=${l.nulos / l.comparecimento} fmt=${Ee} />
            </div>
          </section>`
        : null
    }
  </section>`;
}
function renderStatusResultadoMunicipal(l, u) {
  return l
    ? html`${ht(l.totalizadas)} de ${ht(l.secoes)} seções
      totalizadas${vt.on ? ". Revendo a noite, os votos da cidade são os de agora." : ""}`
    : vo.bad[u]
      ? "Não foi possível carregar a cidade agora; tentamos de novo em instantes."
      : "Dados municipais indisponíveis nesta atualização.";
}
