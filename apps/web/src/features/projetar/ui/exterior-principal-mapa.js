import { html } from "./formatacao-e-acessibilidade-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { El } from "./mapa-interativo-1.js";
import { jl } from "./navegacao-e-patrocinio-1.js";

export function MapaExterior({
  estado,
  model,
  country,
  city,
  navigate,
  size,
  holder,
  mobile,
  flow,
  compactMap,
  tabs,
}) {
  return html`<nav
      class="exterior-breadcrumb crumbs"
      aria-label="Recorte do mapa"
    >
      <button class="btn" onClick=${() => estado.De("pres", null)}>
        Brasil
      </button>
      <button
        class="btn"
        aria-current=${!country ? "location" : null}
        onClick=${() => navigate()}
      >
        Exterior
      </button>
      ${country ? html`<button class="btn" aria-current=${city == null ? "location" : null} onClick=${() => navigate(null, country)}>${zt.countries.find((entry) => entry.iso === country)?.name || country}</button>` : null}
      ${city != null ? html`<span aria-current="location">${zt.cities[city].name}</span>` : null}
    </nav>
    <div class="exterior-stage" ref=${holder}>
      ${size.width > 40 && size.height > 40 ? html`<${El} m=${model} mode="pres" level="mun" focus="ZZ" country=${country} town=${city} cw=${size.width} ch=${size.height} rect=${retanguloExterior(size, mobile, compactMap, tabs && (country || city != null))} s=${jl(size.width, size.height, devicePixelRatio || 1)} onPick=${() => {}} onTown=${() => {}} onCity=${(index) => navigate(index, zt.cities[index].iso)} onCountry=${(iso) => navigate(null, iso)} small=${mobile} flow=${flow} tv=${estado.g} intro=${false} />` : null}
    </div>`;
}

function retanguloExterior(size, mobile, compactMap, selected) {
  const side = size.width <= 1199 ? 264 : size.width <= 1299 ? 320 : 376;
  return {
    x0: mobile ? 4 : side,
    y0: compactMap ? 16 : 64,
    x1: Math.max((mobile ? 4 : side) + 40, size.width - (mobile ? 4 : side)),
    y1: Math.max(120, size.height - (compactMap ? 16 : selected ? 200 : 160)),
  };
}
