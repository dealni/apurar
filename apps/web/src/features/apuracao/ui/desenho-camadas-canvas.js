import { html } from './formatacao-e-acessibilidade-1.js';

export function desenharCanvas(contexto) {
  const {
    js,
    ta,
    er,
    Gn,
    Eo,
    Bt,
    ve,
    Ke,
    we,
    Js,
    Jn,
    lo,
    ms,
    yo,
    ro,
    Mt,
    de,
    Ye,
    He,
    zn,
    focus,
    ar,
    fo,
    Hd,
    Ud,
  } = contexto;
  return html` <div class="mapzoom" ref=${js}>
    <canvas
      class="map"
      ref=${Bt}
      style=${ar + ';cursor:' + (He != null || de != null || (lo && (lo !== focus || fo)) ? 'pointer' : Js || ta ? 'grab' : 'default')}
      onMouseMove=${Hd}
      onMouseLeave=${() => {
        (Jn(null), ms(null), yo(null), ro(null), Mt(null), Ye(null), zn(null));
      }}
      onClick=${Ud}
      onPointerDown=${er}
      onPointerMove=${Gn}
      onPointerUp=${Eo}
      onPointerCancel=${Eo}
      role="img"
      aria-label=${focus === "ZZ" ? "Mapa eleitoral do exterior" : "Mapa eleitoral do Brasil"}
      aria-description="As cores correspondem à legenda do mapa. Use a busca de local para consultar os resultados em texto. Use os botões de zoom para aproximar ou afastar o mapa."
    ></canvas>
    <canvas
      class="map prev"
      ref=${ve}
      style=${ar + ';opacity:0'}
      aria-hidden="true"
    ></canvas>
    <canvas class="map hov" ref=${Ke} style=${ar} aria-hidden="true"></canvas>
    <canvas class="map fx" ref=${we} style=${ar} aria-hidden="true"></canvas>
  </div>`;
}
