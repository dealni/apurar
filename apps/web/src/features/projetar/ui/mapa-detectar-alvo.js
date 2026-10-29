import { zt } from "./municipios-e-distritos-2.js";
import { Geo } from "../geography.js";
import { En, vn } from "./municipios-e-distritos-1.js";
import { _eState } from "./mapa-dados-1.js";
import { U } from "./formatacao-e-acessibilidade-1.js";
import {
  localizarRotulo,
  localizarExterior,
  localizarColuna,
  localizarDetalheMunicipal,
  localizarZona,
  localizarMunicipio,
} from "./desenho-alvos.js";

function detalheMunicipal(mapView, props, view, x, y, mx, my) {
  const { m: modelo, mode, town } = props;
  if (town == null || mode !== "pres" || mapView.cn) return null;
  const dados = En(modelo, town);
  if (dados) {
    const detalhe = localizarDetalheMunicipal({
      dados,
      town,
      view,
      rotulos: mapView.ot.current,
      x,
      y,
      mx,
      my,
    });
    if (detalhe) return detalhe;
  }
  if ((_eState.value && !_eState.value.zone) || vn(modelo, town)) return null;
  const zonas = U(town);
  return zonas ? localizarZona(zonas, mx, my) : null;
}
export function criarDetectorDeAlvo({ interaction, mapView, props }) {
  const { Ns } = interaction;
  const { Ae, be, dn, Xe, cn, ls } = mapView;
  const { focus, town } = props;
  return (evento, duranteTransicao = false) => {
    const view = duranteTransicao && dn.current ? dn.current.view : Ae.current;
    if (!view || (ls && !duranteTransicao)) return null;
    const [x, y] = Ns(evento);
    if (focus === "ZZ" && zt)
      return localizarExterior(view, x, y, Xe.current.zk);
    const rotulo = localizarRotulo(be.current, x, y);
    if (rotulo) return { uf: Geo.munis[rotulo.i].uf, x, y, muni: rotulo.i };
    const coluna = cn ? localizarColuna(x, y) : null;
    if (coluna) return coluna;
    const mx = (x - view.ox) / view.k;
    const my = (y - view.oy) / view.k;
    const detalhe = detalheMunicipal(mapView, props, view, x, y, mx, my);
    if (detalhe)
      return { uf: Geo.munis[town].uf, x, y, muni: town, ...detalhe };
    const municipio = localizarMunicipio(mx, my);
    return { uf: null, x, y, ...municipio };
  };
}
