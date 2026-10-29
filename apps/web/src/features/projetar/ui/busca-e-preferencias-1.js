import { isolateModalBackground } from "../../../runtime/modal-background.ts";
import {
  useState,
  useEffect,
  X,
  Te,
  useRef,
  useMemo,
  html,
  J,
  Xt,
} from "./formatacao-e-acessibilidade-1.js";
import { K1, Fc } from "./avisos-e-ticker-1.js";
import { Feed } from "../feed.js";
import { Dl } from "./regioes-1.js";
import { We, Fe } from "../object-helpers.js";
import { vr, an } from "./candidatos-e-partidos-1.js";
import { So } from "./hud-e-comunicacao-1.js";
import { Eu, Si } from "./paineis-e-projecoes-1.js";
import { Ai } from "./candidatos-e-partidos-2.js";
export let Y1, J1, Q1, Sa, Ya, td, ed, nd, sd, Oc;
export function initialize() {
  Y1 =
    /^(?:zona\s*(?:eleitoral\s*)?)?(\d{1,4})\s*[aª°º]?\s*(?:zona(?:\s*eleitoral)?)?\s*(?:(?:de|do|da|em)\s+)?(.*)$/;
  J1 = shellJ1;
  Q1 = shellQ1;
  Sa = [
    ["pres", "Presidente"],
    ["gov", "Governadores"],
  ];
  Ya = shellYa;
  td = shelltd;
  ed = !!(window.APURACAO && window.APURACAO.turno === 2);
  nd = !!(window.CANDIDATOS && window.CANDIDATOS.turno === 2);
  sd = shellsd;
  Oc = {
    reconectando: "Reconectando · números de ",
    "sem-conexao": "Sem internet · números de ",
    parado: "Aguardando novos votos desde ",
  };
}
function shellJ1(t, e = null, office = null) {
  const n = X(t.trim()),
    s = K1().filter(
      (item) =>
        (item.t !== "cand" ||
          item.office === "pres" ||
          item.office === "gov") &&
        (office !== "gov" || item.t === "uf" || item.t === "town"),
    ),
    a = (i) =>
      i.w + (e && (i.t === "town" || i.t === "zone") && i.uf === e ? 0.5 : 0);
  if (!n) {
    if (e === "ZZ")
      return s
        .filter((l) => l.t === "city")
        .sort((l, d) => d.el - l.el)
        .slice(0, 6);
    const i = Dl.list()
        .map((l) => s.find((d) => d.t === "town" && d.i === l))
        .filter(Boolean)
        .map((l) =>
          We(Fe({}, l), {
            fav: !0,
          }),
        ),
      c = new Set(i.map((l) => l.i));
    return i.concat(
      s
        .filter((l) => l.t === "town" && (!e || l.uf === e) && !c.has(l.i))
        .sort((l, d) => d.pop - l.pop)
        .slice(0, 6),
    );
  }
  const r = [],
    u = Y1.exec(n);
  if (u) {
    const i = +u[1],
      c = u[2].trim();
    for (const l of office === "gov" ? [] : Fc())
      correspondeAZona({
        l,
        i,
        c,
      }) && r.push([0, l]);
  } else
    for (const i of s.concat(office === "gov" ? [] : Fc())) {
      const c = i.key,
        l = prioridadeDoResultado({
          i,
          n,
          c,
        });
      l != null && r.push([l, i]);
    }
  return r
    .sort((i, c) => i[0] - c[0] || a(c[1]) - a(i[1]))
    .slice(0, 8)
    .map((i) => i[1]);
}
function shellQ1({
  onClose: t,
  onChoose: e,
  focus: n = null,
  office = null,
  decorate = null,
  searchLabel = null,
  placeholder = null,
}) {
  const descricao =
      office === "gov"
        ? "município ou estado"
        : n === "ZZ"
          ? "município, estado, país, cidade do exterior ou candidato"
          : "município, estado ou candidato",
    rotulo = searchLabel || "Buscar " + descricao,
    sugestao = placeholder || descricao[0].toUpperCase() + descricao.slice(1);
  const [s, a] = useState(""),
    [r, u] = useState(0),
    i = useRef(null),
    retorno = useRef(document.activeElement);
  useEffect(() => {
    const restoreBackground = isolateModalBackground(
      i.current.closest(".sbox"),
    );
    i.current.focus();
    return () => {
      restoreBackground();
      const acionador = retorno.current;
      const fallback =
        acionador && acionador !== document.body && acionador.isConnected
          ? acionador
          : document.querySelector(".sbtn");
      fallback?.focus({ preventScroll: true });
    };
  }, []);
  const [c, l] = useState(0);
  useEffect(() => {
    const f = () => l((m) => m + 1);
    const unsubscribe = Feed.on("snap", f);
    return unsubscribe;
  }, []);
  const d = useMemo(
    () => J1(s, n, office).map((item) => (decorate ? decorate(item) : item)),
    [s, c, n, office, decorate],
  );
  const ativo = Math.max(0, Math.min(r, d.length - 1)),
    disponiveis = d.filter((item) => !item.unavailable).length,
    vazio = s.trim()
      ? `Nada encontrado para “${s.trim()}”.`
      : "Nenhum local disponível para esta seleção.";
  useEffect(() => {
    document.getElementById("sr" + ativo)?.scrollIntoView({ block: "nearest" });
  }, [ativo, d]);
  return html`<div
    class="search"
    onMouseDown=${(f) => {
      f.target === f.currentTarget && t();
    }}
  >
    <div
      class="sbox"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
      onKeyDown=${(f) => {
        if (f.isComposing) return;
        if (f.key === "Escape") {
          (f.preventDefault(), f.stopPropagation(), t());
        } else if (f.key === "Tab") {
          f.preventDefault();
          const cancelar = f.currentTarget.querySelector(".scancel");
          (document.activeElement === i.current
            ? cancelar
            : i.current
          )?.focus();
        }
      }}
    >
      <div class="sin">
        <${vr} /><input
          ref=${i}
          value=${s}
          maxlength="60"
          onInput=${(f) => {
            (a(f.target.value), u(0));
          }}
          onKeyDown=${(f) => {
            if (f.isComposing) return;
            f.key === "ArrowDown"
              ? (f.preventDefault(),
                u(Math.max(0, Math.min(d.length - 1, ativo + 1))))
              : f.key === "ArrowUp"
                ? (f.preventDefault(), u(Math.max(0, ativo - 1)))
                : f.key === "Enter" && d[ativo] && !d[ativo].unavailable
                  ? (f.preventDefault(), e(d[ativo]))
                  : f.key === "Escape" &&
                    (f.preventDefault(), f.stopPropagation(), t());
          }}
          placeholder=${sugestao}
          aria-label=${rotulo}
          role="combobox"
          aria-expanded="true"
          aria-controls="sres"
          aria-autocomplete="list"
          aria-activedescendant=${d[ativo] ? "sr" + ativo : null}
          autocomplete="off"
          spellcheck="false"
        /><kbd aria-hidden="true">Esc</kbd
        ><button type="button" class="scancel" onClick=${t}>Cancelar</button>
      </div>
      <div
        class="search-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        ${d.length ? `${disponiveis} ${disponiveis === 1 ? "resultado disponível" : "resultados disponíveis"}. Use as setas para navegar.` : vazio}
      </div>
      <div
        class="sres"
        id="sres"
        role="listbox"
        aria-label="Resultados da busca"
      >
        ${s.trim() ? null : html`<div class="sgroup">${d[0] && d[0].fav ? "Minhas cidades" : "Maiores cidades" + (n === "ZZ" ? " no exterior" : n ? " " + J(n) : "")}</div>`}
        ${
          d.length
            ? d.map(
                (f, m) =>
                  html`${!s.trim() && m > 0 && d[m - 1].fav && !f.fav ? html`<div class="sgroup" key="gm">Maiores cidades${n ? " " + J(n) : ""}</div>` : null}
                    <div
                      class="srow"
                      id=${"sr" + m}
                      role="option"
                      aria-selected=${m === ativo}
                      aria-disabled=${!!f.unavailable}
                      key=${
                        f.t +
                        chaveDoResultado({
                          f,
                        })
                      }
                      onMouseMove=${() => m !== ativo && u(m)}
                      onClick=${() => !f.unavailable && e(f)}
                    >
                      ${f.t === "cand" ? html`<${an} c=${f.c} size=${30} round />` : f.t === "zz" ? html`<span class="uft big plain gl"><${So} size=${14} /></span>` : f.t === "zone" ? html`<span class="uft big plain zt">${f.z}</span>` : html`<span class="uft big plain">${f.iso || f.uf}</span>`}
                      <div style="min-width:0">
                        <div class="nm">${f.label}</div>
                        <div class="sub">${f.sub}</div>
                      </div>
                      ${m === ativo && !f.unavailable ? html`<kbd>↵</kbd>` : html`<span></span>`}
                    </div>`,
              )
            : html`<div class="sempty">${vazio}</div>`
        }
      </div>
      <div class="sfoot">
        <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span
        ><span><kbd>↵</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span>
      </div>
    </div>
  </div>`;
}
function shellYa({ office: t, set: e, tv: n, m: s = null }) {
  if (Sa.length < 2) return null;
  const a = !n && Eu(s) ? Ai(s) : null,
    r = (u) => !!a && u === "gov" && a.gov.length > 0;
  return html`<div class="switch" role="group" aria-label="Cargo">
    ${Sa.map(([u, i]) => html`<button type="button" key=${u} aria-pressed=${t === u} aria-label=${r(u) ? i + ", em apuração" : i} disabled=${n} tabindex=${n ? -1 : 0} onClick=${() => !n && e(u)}>${i}${r(u) ? html`<${Si} />` : null}</button>`)}
  </div>`;
}
function shelltd() {
  ((location.hash = Xt === 2 ? "#presidente" : "#presidente~2t"),
    location.reload());
}
function shellsd({ onClose: t }) {
  return (
    useEffect(() => {
      const e = (n) => !n.target.closest(".about,.sim") && t();
      return (
        addEventListener("mousedown", e),
        () => removeEventListener("mousedown", e)
      );
    }, []),
    Feed.LIVE
      ? null
      : html`<div class="about" role="dialog" aria-label="Sobre a simulação">
          <h4>Simulação</h4>
          <p>
            Candidatos, partidos, números de urna e fotos são os registrados no
            TSE para 2026.
          </p>
          <p>
            Todos os votos, percentuais e resultados desta tela são inventados,
            para mostrar o desenho da noite. Não é pesquisa nem previsão.
          </p>
          <p>
            As linhas de 2022 são o resultado real do ${Xt}º turno de 2022, no
            TSE. O ritmo da apuração repete o daquele turno, estado por estado.
            Os horários são de Brasília.
          </p>
          ${Xt === 2 ? html`<p>${nd ? "Este é o 2º turno da simulação: os candidatos são os do 2º turno no TSE" + (window.TURNO1 ? ", e as linhas do 1º turno são o resultado real de 4 de outubro." : ".") : "Este é o 2º turno da simulação: os dois mais votados do 1º turno simulado, e governador só nos estados em que a disputa não se decidiu no 1º turno."}</p>` : null}
          ${ed ? null : html`<p><button class="btn" onClick=${() => td()}>Ver a simulação do ${Xt === 2 ? "1º" : "2º"} turno</button></p>`}
        </div>`
  );
}
function prioridadeDoResultado({ i, n, c }) {
  return i.alias && i.alias.includes(n)
    ? i.t === "uf"
      ? -2
      : -1
    : c === n
      ? 0
      : c.startsWith(n)
        ? 1
        : c.includes(" " + n)
          ? 2
          : c.includes(n)
            ? 3
            : null;
}
function chaveDoResultado({ f }) {
  return f.t === "town" || f.t === "city"
    ? f.i
    : f.t === "zone"
      ? f.i + "-" + f.z
      : f.t === "uf" || f.t === "zz"
        ? f.uf
        : f.t === "country"
          ? f.iso
          : f.c.id + f.office;
}
function correspondeAZona({ l, i, c }) {
  return (
    l.z === i &&
    (!c ||
      l.uf.toLowerCase() === c ||
      l.town.startsWith(c) ||
      l.town.includes(" " + c) ||
      X(Te[l.uf]).startsWith(c))
  );
}
function correspondeAoEstado({ c, l }) {
  return !c || l.uf.toLowerCase() === c || X(Te[l.uf]).startsWith(c);
}
