export function legendasDaImagem(be, context) {
  const demo = context.mode === "demo";
  const { mode, timestamp } = metadadosDaFonte(context, demo);
  return {
    mode,
    source: `Data e hora da fonte: ${timestamp} (Brasília)`,
    rows: [],
    reason:
      be.n?.secDone === 0 && be.n?.valid === 0
        ? "Aguardando o início da apuração."
        : null,
    synthetic: demo
      ? "Dados inventados para demonstração. Não é uma estimativa eleitoral."
      : null,
  };
}

export function linhasAjustadas(context, text, width) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let line = "";
  const segments = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const { segment } of segments.segment(word)) {
      if (line && context.measureText(line + segment).width > width) {
        lines.push(line);
        line = "";
      }
      line += segment;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function desenharNotas(context, notes, width, scale, start) {
  let y = start;
  for (const note of notes.filter((item) => item?.text)) {
    context.font = `${note.bold ? 600 : 500} ${note.size * scale}px Apurar Sans, sans-serif`;
    context.fillStyle = note.color || "#8a8f98";
    if (note.colors?.length) {
      note.colors.forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect((24 + index * 22) * scale, y, 16 * scale, 10 * scale);
      });
      y += 18 * scale;
      context.fillStyle = note.color || "#8a8f98";
    }
    for (const line of linhasAjustadas(
      context,
      note.text,
      width - 48 * scale,
    )) {
      if (note.draw !== false) context.fillText(line, 24 * scale, y);
      y += (note.size + 9) * scale;
    }
    y += 6 * scale;
  }
  return y;
}

function metadadosDaFonte(context, demo) {
  const mode = [
    demo
      ? "DEMONSTRAÇÃO · DADOS FICTÍCIOS"
      : context.available === false
        ? "DADOS OFICIAIS INDISPONÍVEIS"
        : "AO VIVO · DADOS OFICIAIS TSE",
    context.replay ? "HISTÓRICO · PUBLICAÇÃO PRESERVADA" : null,
  ].filter(Boolean);
  if (context.replay && !demo && context.available !== false)
    mode[0] = "DADOS OFICIAIS TSE";
  const date = context.as_of ? new Date(context.as_of) : null;
  const timestamp =
    date && Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "medium",
        }).format(date)
      : "indisponível";
  return { mode, timestamp };
}

export function legendaDoMapa() {
  const layer =
    document
      .querySelector('.seg2 button[aria-pressed="true"]')
      ?.textContent?.trim() ||
    document.querySelector(".compact-map-legend > p")?.textContent?.trim();
  const entries = [...(document.querySelector(".legend")?.children || [])];
  if (!entries.length) return [];
  return [
    {
      text: `Legenda do mapa${layer ? " · " + layer : ""}`,
      size: 19,
      bold: true,
      color: "#f7f8f8",
    },
    ...entries.map((entry) => ({
      text: [entry.getAttribute("title"), textoVisivel(entry)]
        .filter(Boolean)
        .join(" · "),
      size: 17,
      color: "#d0d6e0",
      colors: [...entry.querySelectorAll("i")].map(
        (swatch) => getComputedStyle(swatch).backgroundColor,
      ),
    })),
  ];
}

function textoVisivel(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const parts = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    let parent = node.parentElement;
    let visible = true;
    while (parent && parent !== element) {
      if (getComputedStyle(parent).display === "none") visible = false;
      parent = parent.parentElement;
    }
    if (visible && node.textContent.trim()) parts.push(node.textContent.trim());
  }
  return parts.join(" ").replace(/\s+/g, " ");
}

export function tituloDoMapa() {
  const crumbs = document.querySelector(".crumbs")?.textContent;
  const heading = document.querySelector(".stc .sh h2")?.textContent;
  const region = document.querySelector(".stc .sh .sub span")?.textContent;
  return (crumbs || [heading, region].filter(Boolean).join(" · ") || "Brasil")
    .replace(/\s*›\s*/g, " › ")
    .replace(/\s+/g, " ")
    .trim();
}
