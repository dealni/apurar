import {
  html,
  useEffect,
  useMemo,
  useRef,
  useState,
  ge,
} from "./formatacao-e-acessibilidade-1.js";
import { criarEscolhaDaBusca } from "./tela-escolher-busca.js";
import { zt } from "./municipios-e-distritos-2.js";
import { MapaExterior } from "./exterior-principal-mapa.js";
import { Q1, Ya } from "./busca-e-preferencias-1.js";
import { ad, fd, Ul, Dc } from "./navegacao-e-patrocinio-1.js";
import { layoutDoPainel } from "./shell-layout.js";
import { exportarExterior } from "./exterior-principal-exportacao.js";
import { statusExterior } from "./exterior-source.js";
import { useSupplemental } from "./official-result.js";
import { createExteriorMainModel } from "../../../integration/exterior-main-model.ts";
import {
  ControlesExterior,
  ResultadoExterior,
} from "./exterior-principal-paineis.js";
import "../styles/39-exterior-principal.css";

export function ExteriorPrincipal({ estado }) {
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
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("mapa");
  const [size, setSize] = useState({ width: 800, height: 580 });
  const exterior = useMemo(
    () => createExteriorMainModel(payload, zt.cities),
    [payload],
  );
  const model = useMemo(
    () => ({ ...estado.be, zz: exterior.zz, exterior, towns: true }),
    [estado.be, exterior],
  );
  const country =
    estado.Bn || (estado.ye != null ? zt.cities[estado.ye]?.iso : null);
  const city = estado.ye;
  const navigate = (index = null, iso = null) => {
    estado.De("pres", "ZZ", index, "mun", iso);
    if (layout.tabs) setTab("mapa");
  };
  useEffect(() => {
    if (layout.tabs) setTab("mapa");
    if (layout.flow) scrollTo({ top: 0, behavior: ge ? "auto" : "smooth" });
  }, [country, city, layout.tabs, layout.flow]);
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
  useEffect(() => {
    if (!estado.r) estado.ke();
  }, [estado.r]);
  const share = async () => {
    try {
      await exportarExterior({ model: exterior, country, city });
      setNotice("Download da imagem iniciado.");
    } catch {
      setNotice("Não foi possível exportar a imagem. Tente novamente.");
    }
  };
  const chooseOther = criarEscolhaDaBusca({ ...estado, yn: "pres" });
  const choose = (result) => {
    estado.w(false);
    if (result.t === "city") navigate(result.i, zt.cities[result.i].iso);
    else if (result.t === "country") navigate(null, result.iso);
    else if (result.t === "zz") navigate();
    else chooseOther(result);
  };
  return html`<section
    class=${classesExterior(layout, estado.g)}
    data-tab=${tab}
    aria-label="Mapa principal do exterior"
  >
    <${Ul}
      m=${model}
      t=${estado.s}
      live=${true}
      office="pres"
      setOffice=${estado.go}
      onShare=${share}
      shareLabel="Compartilhar"
      onTV=${estado.Vs}
      onExit=${estado.On}
      onSearch=${() => estado.w(true)}
      phone=${mobile}
      headerClass="exterior-header"
      sourceStatus=${html`<span class="live exterior-source" role="status"><i aria-hidden="true"></i><span class="lt tn">${statusExterior({ error, loading, payload })}</span></span>`}
      tv=${estado.g}
      abroad
      onBrasil=${() => estado.De("pres", null)}
      apurTop=${false}
      connectionStatus=${false}
    />
    ${mobile ? html`<div class="exterior-office-selector swbar"><${Ya} office="pres" set=${estado.go} tv=${estado.g} m=${model} /></div>` : null}
    <div class="exterior-workspace">
      <aside class="exterior-sidebar col l">
        <section class="card exterior-summary" aria-label="Filtrar o exterior">
          <h1>Exterior</h1>
          <${ControlesExterior}
            country=${country}
            city=${city}
            navigate=${navigate}
          />${exterior.catalogError ? html`<p class="note" role="alert">Lista oficial de locais incompleta. Alguns locais podem estar indisponíveis.</p>` : null}
        </section>
      </aside>
      <div class="exterior-map-column">
        <${MapaExterior}
          estado=${estado}
          model=${model}
          country=${country}
          city=${city}
          navigate=${navigate}
          size=${size}
          holder=${holder}
          mobile=${mobile}
          flow=${rolagemDoExterior(layout, estado.g)}
          compactMap=${mapaCompacto(layout, estado.g, W, H)}
          tabs=${layout.tabs}
        />
        <div class="exterior-map-key">
          <div
            class="exterior-candidate-legend"
            aria-label="Legenda das candidaturas"
          >
            ${exterior.candidates.map((candidate) => html`<span key=${candidate.id}><i style=${"background:" + candidate.color}></i>${candidate.name}</span>`)}
            <span><i class="exterior-neutral"></i>Sem liderança</span>
          </div>
          <details class="exterior-map-help">
            <summary>Como ler o mapa</summary>
            <p class="note exterior-legend">
              Cada ponto representa uma cidade com votação no exterior. Cinza:
              empate, sem votos ou sem dados disponíveis.
            </p>
            <p class="note">
              Os resultados por país somam as cidades oficiais disponíveis. A
              cobertura pode ser parcial; cada resultado informa seu próprio
              horário.
            </p>
          </details>
        </div>
      </div>
      ${layout.tabs && (country || city != null) && tab === "mapa" ? html`<button class="exterior-selected" onClick=${() => setTab("resultados")}><span>${city != null ? zt.cities[city]?.name : zt.countries.find((entry) => entry.iso === country)?.name}</span><b>Ver resultado oficial ↑</b></button>` : null}
      <${ResultadoExterior}
        model=${exterior}
        country=${country}
        city=${city}
        navigate=${navigate}
      />
    </div>
    ${layout.tabs ? html`<${fd} tab=${tab} setTab=${setTab} />` : null}
    ${notice ? html`<p class="exterior-notice" role="status">${notice}<button class="btn" onClick=${() => setNotice("")}>Fechar</button></p>` : null}
    ${estado.x ? html`<${Q1} searchLabel="Buscar país, cidade, município ou estado" placeholder="País, cidade, município ou estado" onClose=${() => estado.w(false)} onChoose=${choose} focus="ZZ" />` : null}
  </section>`;
}

function classesExterior(layout, tv) {
  return [
    "hud exterior-principal",
    layout.mobile && "phone",
    layout.tabs && "shell",
    layout.flow && "flow",
    layout.landscape && "land",
    layout.tablet && "tablet",
    tv && "tv exterior-tv",
  ]
    .filter(Boolean)
    .join(" ");
}

function mapaCompacto(layout, tv, width, height) {
  return (
    layout.flow ||
    layout.tablet ||
    layout.landscape ||
    (tv && width < 600 && height >= width)
  );
}

function rolagemDoExterior(layout, tv) {
  return !tv && (layout.flow || layout.tablet || layout.landscape);
}
