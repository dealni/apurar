// Endereços antigos abrem a seleção no mapa principal, sem painéis paralelos.
export function normalizeMainMapUrl(input: URL): URL {
  const url = new URL(input);
  const panel = url.searchParams.get("painel");
  url.searchParams.delete("painel");
  url.searchParams.delete("demo");
  if (panel === "governadores") {
    const local =
      /^#(?:presidente|governadores)(-[a-z]{2}(?:-\d+)?)?(?:~.*)?$/u.exec(
        url.hash,
      );
    url.hash = `governadores${local?.[1]?.startsWith("-zz") ? "" : (local?.[1] ?? "")}`;
  } else if (panel === "exterior") {
    if (!url.hash.startsWith("#presidente-zz")) url.hash = "presidente-zz";
  }
  return url;
}
