import { ga, bl } from './mapa-dados-1.js';
import { useEffect, vt, ie } from './formatacao-e-acessibilidade-1.js';
import { Geo } from '../geography.js';
import { Feed } from '../feed.js';
import { zt } from './municipios-e-distritos-2.js';
import { Streets } from '../streets.js';
export function usePreparacaoMapa({ props, mapView, Y }) {
  const {
    m: modelo,
    mode,
    focus,
    town,
    country = null,
    rect,
    tv = false,
  } = props;
  useEffect(() => {
    mapView.vs && mapView.vs.key !== mapView.fn && mapView.io(null);
  }, [mapView.vs, mapView.fn]);
  const gs = (rect.y1 - rect.y0) * (focus ? 0.34 : 0.28),
    fa = obterZonasVisiveis({
      modelo,
      town,
      focus,
      mode,
      mapView,
    }),
    I =
      focus === 'ZZ' && zt
        ? ie(Math.sqrt(mapView.Ge.k / ga(bl('ZZ'), rect, 0).k), 1, 1.8)
        : 1;
  useEffect(
    () => (Streets ? Streets.on(() => mapView.go((A) => A + 1)) : void 0),
    [],
  );
  const K = Streets && mapView.T ? mapView.Ro : 0,
    te =
      !tv &&
      !!Streets &&
      Streets.credit.length > 0 &&
      town != null &&
      !!mapView.T &&
      !!mapView.on &&
      Streets.shows(town, mapView.on);
  mapView.Xe.current = {
    m: modelo,
    mode: mode,
    level: Y,
    focus: focus,
    town: town,
    country: country,
    bk: mapView.rs,
    target: mapView.Ge,
    hmax: gs,
    zk: I,
    vkey: mapView.da,
    lookKey: mapView.xt,
    zoneKey: fa,
    tileKey: K,
  };
  return {
    gs,
    fa,
    I,
    K,
    te,
  };
}
function obterZonasVisiveis({ modelo, town, focus, mode, mapView }) {
  return modelo.live &&
    modelo.towns &&
    town != null &&
    focus !== 'ZZ' &&
    mode === 'pres' &&
    !mapView.cn &&
    !vt.on &&
    Geo.zones(String(Geo.munis[town].id))
    ? Feed.zones(town)
    : null;
}
