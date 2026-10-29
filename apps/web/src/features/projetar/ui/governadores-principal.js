import {
  html,
  useEffect,
  useMemo,
  useRef,
  useState,
  ge,
} from "./formatacao-e-acessibilidade-1.js";
import { layoutDoPainel } from "./shell-layout.js";
import { Geo } from "../geography.js";
import { Q1, Ya } from "./busca-e-preferencias-1.js";
import { ad, fd, Dc } from "./navegacao-e-patrocinio-1.js";
import { useSupplemental } from "./official-result.js";
import {
  useModeloGovernadores,
  resultadoGovernadorSelecionado,
} from "./governadores-modelo.js";
import {
  ControlesGovernadores,
  FaixaGovernadores,
  DetalheGovernador,
  ResumoGovernadores,
  resultadoBuscaGovernadores,
} from "./governadores-principal-paineis.js";
import {
  MapaGovernadores,
  AjudaMapaGovernadores,
} from "./governadores-principal-mapa.js";
import { exportarGovernadores } from "./governadores-principal-exportacao.js";
import {
  CabecalhoGovernadores,
  statusGovernadores,
} from "./governadores-principal-cabecalho.js";
import "../styles/38-governadores-principal.css";

export function GovernadoresPrincipal({ estado }) {
  const { payload, loading, error } = useSupplemental();
  const holder = useRef(null);
  const { W, H } = ad();
  const layout = layoutDoPainel({
    width: W,
    height: H,
    tv: estado.g,
    shell: Dc,
  });
  const { mobile } = layout;
  const [tab, setTab] = useState("mapa");
  const [size, setSize] = useState({ width: 800, height: 580 });
  const [notice, setNotice] = useState("");
  const governor = useModeloGovernadores(payload);
  const model = useMemo(
    () => ({ ...estado.be, governor, towns: true }),
    [estado.be, governor],
  );
  const focus = estado.Rn;
  const town = estado.ye;
  useEffect(() => {
    if (layout.tabs) setTab("mapa");
    if (layout.flow) scrollTo({ top: 0, behavior: ge ? "auto" : "smooth" });
  }, [focus, town, layout.tabs, layout.flow]);
  const selected = resultadoGovernadorSelecionado(governor, focus, town);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    if (holder.current) observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  const side = mobile
    ? 0
    : size.width < 1200
      ? 280
      : size.width <= 1299
        ? 320
        : 376;
  const mapRect = {
    x0: side,
    y0: mobile && !layout.tabs ? 12 : 48,
    x1: Math.max(side + 40, size.width - side),
    y1: size.height - (mobile && !layout.tabs ? 12 : 64),
  };
  const choose = (result) => {
    estado.w(false);
    if (result.t === "uf") estado.De("gov", result.uf);
    else if (result.t === "town") estado.De("gov", result.uf, result.i);
    else
      setNotice(
        "A busca de governadores aceita estados e municípios brasileiros. Para consultar o exterior, selecione Presidente.",
      );
  };
  useEffect(() => {
    if (!estado.r) estado.ke();
  }, [estado.r]);
  return renderizarGovernadores({
    estado,
    governor,
    selected,
    focus,
    town,
    setNotice,
    loading,
    payload,
    error,
    mobile,
    layout,
    tab,
    setTab,
    holder,
    size,
    model,
    mapRect,
    notice,
    choose,
  });
}
function renderizarGovernadores({
  estado,
  governor,
  selected,
  focus,
  town,
  setNotice,
  loading,
  payload,
  error,
  mobile,
  layout,
  tab,
  setTab,
  holder,
  size,
  model,
  mapRect,
  notice,
  choose,
}) {
  return html`<section
    class=${classesGovernadores(layout, estado.g)}
    data-tab=${tab}
    aria-label="Mapa principal de governadores"
  >
    <${CabecalhoGovernadores}
      estado=${estado}
      model=${model}
      selected=${selected}
      focus=${focus}
      town=${town}
      governor=${governor}
      setNotice=${setNotice}
      loading=${loading}
      payload=${payload}
      error=${error}
      mobile=${mobile}
    />
    ${mobile ? html`<div class="gov-office-selector swbar"><${Ya} office="gov" set=${estado.go} tv=${estado.g} m=${model} /></div>` : null}
    ${!mobile ? html`<div class="gov-scoreboard rbwrap"><${FaixaGovernadores} selected=${selected} governor=${governor} focus=${focus} town=${town} navigate=${estado.De} /></div>` : null}
    <div class="gov-workspace">
      <${MapaGovernadores}
        flow=${mapaEmFluxo(layout, estado.g)}
        mobile=${mobile && !layout.tabs}
        tabs=${layout.tabs}
        selected=${selected}
        governor=${governor}
        status=${statusGovernadores({ selected, loading, payload, error })}
        estado=${estado}
        focus=${focus}
        town=${town}
        model=${model}
        size=${size}
        holder=${holder}
        mapRect=${mapRect}
      />
      ${layout.tabs && selected && tab === "mapa" ? html`<button class="gov-selected" onClick=${() => setTab("resultados")}><span>Resultado selecionado</span><b>Ver resultado oficial ↑</b></button>` : null}
      <aside
        class="gov-detail stc col r"
        id="gov-resultado"
        tabIndex=${-1}
        aria-label="Resultado de governadores selecionado"
      >
        ${
          selected
            ? html`<${DetalheGovernador}
                selected=${selected}
                focus=${focus}
                town=${town}
                navigate=${estado.De}
                tv=${estado.g}
              />`
            : html`<section class="card gov-placeholder">
                <div class="sh">
                  <div>
                    <h2>Selecione um estado</h2>
                    <div class="sub">Governador · resultados oficiais</div>
                  </div>
                </div>
                <p class="note">
                  Consulte as disputas no mapa, na busca ou no seletor. Não há
                  total nacional de votos para governador.
                </p>
              </section>`
        }
      </aside>
      <aside class="gov-sidebar col l">
        <section class="card gov-summary">
          <h2 class="gov-filter-title">Consultar local</h2>
          ${!mobile || layout.tabs ? html`<${ControlesGovernadores} focus=${focus} town=${town} governor=${governor} navigate=${estado.De} />` : null}
          ${
            layout.tabs
              ? html`<div>
                  <p class="note gov-mobile-source" role="status">
                    ${statusGovernadores({ selected, loading, payload, error })}
                  </p>
                  <div class="gov-mobile-actions">
                    <button
                      class="btn"
                      onClick=${() => estado.De("pres", "ZZ")}
                    >
                      Ver os votos do exterior</button
                    ><button
                      class="btn"
                      onClick=${async () => {
                        try {
                          await exportarGovernadores({
                            selected,
                            focus,
                            town,
                            governor,
                          });
                          setNotice("Download da imagem iniciado.");
                        } catch {
                          setNotice(
                            "Não foi possível exportar a imagem. Tente novamente.",
                          );
                        }
                      }}
                    >
                      Exportar PNG
                    </button>
                  </div>
                  <${AjudaMapaGovernadores} />
                </div>`
              : null
          }
        </section>
        <${ResumoGovernadores}
          governor=${governor}
          navigate=${estado.De}
          focus=${focus}
          selected=${selected}
          town=${town}
          tv=${estado.g}
        />
      </aside>
    </div>
    ${layout.tabs ? html`<${fd} tab=${tab} setTab=${setTab} />` : null}
    ${notice ? html`<p class="gov-notice" role="status">${notice}<button class="btn" onClick=${() => setNotice("")}>Fechar</button></p>` : null}
    ${estado.x ? html`<${Q1} office="gov" searchLabel="Buscar município ou estado" placeholder="Município ou estado" decorate=${(item) => resultadoBuscaGovernadores(item, governor)} onClose=${() => estado.w(false)} onChoose=${choose} focus=${focus} />` : null}
  </section>`;
}
function classesGovernadores(layout, tv) {
  return [
    "governadores-principal hud",
    layout.mobile && "phone",
    layout.tabs && "shell",
    layout.flow && "flow",
    layout.landscape && "land",
    layout.tablet && "tablet",
    tv && "gov-tv tv",
  ]
    .filter(Boolean)
    .join(" ");
}

function mapaEmFluxo(layout, tv) {
  return !tv && (layout.flow || layout.tablet || layout.landscape);
}
