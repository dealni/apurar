export function obterInteracaoAnterior(contexto) {
  const { pn, As, rs, focus, town, country, F } = contexto;
  return F.sizeKey !== As ||
    F.focus !== focus ||
    F.town !== town ||
    F.country !== country ||
    F.bk !== rs
    ? pn.current
    : null;
}

export function obterChaveRecorte({ focus, town, country, rs }) {
  return [focus || "", town ?? "", country || "", rs ?? ""].join(":");
}
export function recorteEstaPendente({ dn, F, As, se }) {
  return dn.current && dn.current.key === se && F.sizeKey === As;
}
