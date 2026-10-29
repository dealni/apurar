import { criarPulsosDoExterior } from './mapa-pulsos-exterior.js';
import { criarPulsosMunicipais } from './mapa-pulsos-municipios.js';
import { criarAnimacaoDePulsos } from './mapa-animar-pulsos.js';
import { useDesenhoCanvasBase } from './mapa-efeitos-canvas-base.js';
import { useAtalhosDeZoom } from './mapa-atalhos-zoom.js';
import { ba } from './mapa-geometria-1.js';
import { useState, useEffect, ie, Z } from './formatacao-e-acessibilidade-1.js';
import { dt } from './apuracao-e-votos-1.js';
export function useDesenhoPrincipal({
  interaction,
  mapView,
  props,
  Y,
  gs,
  I,
  fa,
  K,
}) {
  useAtalhosDeZoom({
    interaction,
    mapView,
    props,
  });
  const [Jr, Qr] = useState(0);
  useEffect(() => {
    const A = mapView.Bt.current;
    if (!A) return;
    const F = () => {
      ((mapView.D.current = null), ba.clear(), Qr((at) => at + 1));
    };
    return (
      A.addEventListener('contextrestored', F),
      () => A.removeEventListener('contextrestored', F)
    );
  }, []);
  const nr = (A) => {
      const F = new Float32Array(dt);
      for (let at = 0; at < dt; at++) F[at] = Z(A, at);
      return F;
    },
    Ce = () => {
      const A = mapView.ve.current,
        F = mapView.Bt.current;
      !A ||
        !F.width ||
        ((A.width = F.width),
        (A.height = F.height),
        A.getContext('2d').drawImage(F, 0, 0),
        (A.style.transition = 'none'),
        (A.style.opacity = '1'),
        A.offsetWidth,
        (A.style.transition = ''),
        requestAnimationFrame(() => {
          A.style.opacity = '0';
        }));
    },
    Mn = criarAnimacaoDePulsos({
      mapView,
      props,
    }),
    Ws = () => {
      const A = performance.now(),
        F = ie(
          (mapView.Pn.current ? A - mapView.Pn.current : 6e3) - 1200,
          4600,
          7e3,
        );
      return ((mapView.Pn.current = A), F);
    },
    _o = criarPulsosMunicipais({
      mapView,
      props,
      gs,
      Mn,
    }),
    wo = criarPulsosDoExterior({
      mapView,
      props,
      Mn,
    });
  useDesenhoCanvasBase({
    interaction,
    mapView,
    props,
    Ce,
    nr,
    Y,
    gs,
    I,
    Ws,
    wo,
    _o,
    fa,
    K,
    Jr,
  });
}
