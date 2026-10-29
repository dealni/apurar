const exportacoes = new Map();

/** Cada mapa mantém uma única exportação enquanto o PNG está sendo gerado. */
export function exportarMapaOficial(options) {
  const { mapSelector } = options;
  if (exportacoes.has(mapSelector)) return exportacoes.get(mapSelector);
  const pending = gerarImagem(options).finally(() => {
    exportacoes.delete(mapSelector);
  });
  exportacoes.set(mapSelector, pending);
  return pending;
}

async function gerarImagem({ mapSelector, lines, filename }) {
  const map = capturarMapa(mapSelector);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1000, map.width);
  const mapHeight = Math.round((map.height * canvas.width) / map.width);
  const probe = canvas.getContext("2d");
  if (!probe) throw new Error("Exportação indisponível");
  probe.font = '22px "Apurar Sans", sans-serif';
  const wrapped = lines.flatMap((line) => wrap(probe, line, canvas.width - 80));
  canvas.height = mapHeight + 60 + wrapped.length * 34;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Exportação indisponível");
  context.fillStyle = "#111519";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(map, 0, 0, canvas.width, mapHeight);
  context.font = '22px "Apurar Sans", sans-serif';
  context.fillStyle = "#f7f8f8";
  wrapped.forEach((line, index) => {
    const top = mapHeight + 35 + index * 34;
    if (line.color) {
      context.fillStyle = line.color;
      context.fillRect(28, top - 16, 14, 14);
    }
    context.fillStyle = "#f7f8f8";
    context.fillText(line.text, line.color ? 52 : 28, top);
  });
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Imagem indisponível");
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

/** Congela os pixels junto dos metadados do clique, antes de qualquer espera. */
function capturarMapa(mapSelector) {
  const maps = [...document.querySelectorAll(mapSelector)].filter(
    (canvas) => !canvas.classList.contains("prev") && canvas.width > 0,
  );
  if (!maps.length) throw new Error("Mapa indisponível");
  const snapshot = document.createElement("canvas");
  snapshot.width = maps[0].width;
  snapshot.height = maps[0].height;
  const context = snapshot.getContext("2d");
  if (!context) throw new Error("Exportação indisponível");
  for (const map of maps)
    context.drawImage(map, 0, 0, snapshot.width, snapshot.height);
  return snapshot;
}

function wrap(context, line, width) {
  const item = typeof line === "string" ? { text: line } : line;
  const rows = [];
  let text = "";
  for (const word of item.text.split(" ")) {
    const next = text ? text + " " + word : word;
    if (text && context.measureText(next).width > width) {
      rows.push({ text, color: item.color });
      text = word;
    } else text = next;
  }
  rows.push({ text, color: item.color });
  return rows;
}
