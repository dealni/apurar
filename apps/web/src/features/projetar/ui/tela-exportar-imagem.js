import { lt, Ee } from "./formatacao-e-acessibilidade-1.js";
import { Da } from "./paineis-e-projecoes-1.js";
import { Feed } from "../feed.js";
import {
  legendasDaImagem,
  desenharNotas,
  legendaDoMapa,
  tituloDoMapa,
} from "./exportacao-legendas.js";

export function criarExportacaoDeImagem({
  be,
  s,
  replay = false,
  office = "pres",
  focus = null,
}) {
  return async () => {
    const maps = [...document.querySelectorAll("canvas.map")].filter(
      (map) =>
        !map.classList.contains("prev") && map.width > 0 && map.height > 0,
    );
    if (!maps.length) return null;
    const width = maps[0].width;
    const height = maps[0].height;
    const scale = Math.max(1, width / Math.max(1, maps[0].clientWidth));
    const merged = document.createElement("canvas");
    merged.width = width;
    merged.height = height;
    const mapContext = merged.getContext("2d");
    if (!mapContext) return null;
    for (const map of maps) mapContext.drawImage(map, 0, 0, width, height);
    let [left, top, right, bottom] = medirLimitesDoMapa(
      mapContext,
      width,
      height,
    );
    if (right <= left || bottom <= top) {
      left = top = 0;
      right = width;
      bottom = height;
    }
    const pad = 28 * scale;
    left = Math.max(0, left - pad);
    top = Math.max(0, top - pad);
    right = Math.min(width, right + pad);
    bottom = Math.min(height, bottom + pad);
    const mapWidth = right - left;
    const mapHeight = bottom - top;
    const context = Feed.exportContext?.(be.t ?? s, replay) || {};
    const exportView =
      context.available === false ? { ...be, n: null, proj: null } : be;
    const presidential = office === "pres" && focus !== "ZZ";
    const captions = presidential
      ? legendasDaImagem(exportView, context)
      : { mode: [], rows: [] };
    const title = tituloDoMapa();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(Math.max(mapWidth, 720 * scale));
    const probe = canvas.getContext("2d");
    if (!probe) return null;
    const header = [
      {
        text: "Apuração 2026 · " + title,
        size: 26,
        bold: true,
        color: "#f7f8f8",
      },
      ...captions.mode.map((text) => ({
        text,
        size: 19,
        bold: true,
        color: "#d9b57b",
      })),
      {
        text: presidential ? legendaOficial(exportView.n) : null,
        size: 19,
        color: "#f7f8f8",
      },
      {
        text:
          presidential && exportView.n?.voteDestinationWarning
            ? "Votos por candidatura incluem destinações distintas dos votos válidos oficiais. Percentuais entre candidaturas."
            : null,
        size: 17,
        color: "#d9b57b",
      },
      { text: captions.source, size: 17 },
    ];
    const footer = [
      ...legendaDoMapa(),
      { text: captions.title, size: 24, bold: true, color: "#f7f8f8" },
      ...captions.rows.map((text) => ({
        text,
        size: 22,
        bold: true,
        color: "#f7f8f8",
      })),
      { text: captions.preCount, size: 18, color: "#d9b57b" },
      { text: captions.synthetic, size: 18, color: "#d9b57b" },
      { text: captions.reason, size: 17 },
      { text: captions.warning, size: 17 },
      { text: location.host, size: 16 },
    ];
    // Pixels e legendas pertencem ao clique, mesmo se o feed ou o recorte mudar.
    await document.fonts.load('600 26px "Apurar Sans"');
    const headerBottom = desenharNotas(
      probe,
      header,
      canvas.width,
      scale,
      32 * scale,
    );
    const footerStart = headerBottom + mapHeight + 28 * scale;
    canvas.height = Math.ceil(
      desenharNotas(probe, footer, canvas.width, scale, footerStart) +
        16 * scale,
    );
    const drawing = canvas.getContext("2d");
    drawing.fillStyle = "#08090a";
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    drawing.textBaseline = "top";
    desenharNotas(drawing, header, canvas.width, scale, 32 * scale);
    drawing.drawImage(
      merged,
      left,
      top,
      mapWidth,
      mapHeight,
      (canvas.width - mapWidth) / 2,
      headerBottom,
      mapWidth,
      mapHeight,
    );
    drawing.fillStyle = "#0f1011";
    drawing.strokeStyle = "#23252a";
    drawing.beginPath();
    drawing.roundRect(
      12 * scale,
      footerStart - 12 * scale,
      canvas.width - 24 * scale,
      canvas.height - footerStart,
      10 * scale,
    );
    drawing.fill();
    drawing.stroke();
    desenharNotas(drawing, footer, canvas.width, scale, footerStart);
    return new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => resolve(blob || null), "image/png");
      } catch {
        resolve(null);
      }
    });
  };
}

function legendaOficial(result) {
  if (!result || result.available === false)
    return "Apuração oficial indisponível neste recorte.";
  const order = result.order || [];
  const names = (index) => lt[index]?.exib || lt[index]?.name || "";
  const base =
    result.base ?? result.cand?.reduce((sum, votes) => sum + votes, 0);
  if (base > 0 && order.length >= 2) {
    return `Brasil · ${names(order[0])} ${Ee(result.cand[order[0]] / base)} · ${names(order[1])} ${Ee(result.cand[order[1]] / base)} · ${Da(result.pst)} das seções totalizadas`;
  }
  return `${Da(result.pst)} das seções totalizadas`;
}

function medirLimitesDoMapa(js, K, te) {
  let fs = K,
    pn = te,
    bs = 0,
    ys = 0;
  try {
    const Dn = js.getImageData(0, 0, K, te).data,
      Gs = 2;
    for (let ws = 0; ws < te; ws += Gs)
      for (let _s = 0; _s < K; _s += Gs)
        Dn[(ws * K + _s) * 4 + 3] > 16 &&
          (_s < fs && (fs = _s),
          _s > bs && (bs = _s),
          ws < pn && (pn = ws),
          ws > ys && (ys = ws));
  } catch {
    ((fs = 0), (pn = 0), (bs = K - 1), (ys = te - 1));
  }
  return [fs, pn, bs, ys];
}
