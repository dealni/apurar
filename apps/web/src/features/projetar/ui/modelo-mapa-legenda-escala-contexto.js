import { xn, En, $t, vn, wt } from "./municipios-e-distritos-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { lt } from "./formatacao-e-acessibilidade-1.js";
import { _r, Vi } from "./mapa-dados-2.js";
export function prepararContexto({
  m: t,
  mode: e,
  level: n,
  cand: a = null,
  focus: i,
  town: c,
  country: l = null,
  bairro: M = null,
  ...resto
}) {
  const x = M != null && c != null ? xn(c) : null,
    w = x ? x.bairros[M] : null,
    z = new Map(),
    gt = (Mt) => {
      const de = z.get(Mt.partido) || {
        c: Mt,
        n: 0,
      };
      (de.n++, z.set(Mt.partido, de));
    },
    _ = i === "ZZ" && !!zt,
    j = temMunicipios(e, n, i, _),
    Y = e === "pres" && n === "votes" && !_,
    E = obterCandidato(e, n, a),
    T = e === "pres" && _r(n) ? Vi(t, n) : null;
  return {
    t,
    e,
    n,
    a,
    i,
    c,
    l,
    M,
    ...resto,
    x,
    w,
    z,
    gt,
    _,
    j,
    Y,
    E,
    T,
  };
}
export function prepararLocais(ctx) {
  const { t, e, c, _, Y, T } = ctx;
  const Ct = obterLocais(c, _, e, Y, t),
    xt = Ct ? $t(t, c, Ct) : null,
    Bt = xt
      ? xt.filter((Mt) => Mt && Mt.list[0] && Mt.list[0].votes > 0)
      : null,
    ve = obterZonasDisponiveis(Bt, c, _, e, Y, T, t),
    Ke = ve
      ? ve.rows.filter(
          (Mt) => Mt.f > 0 && Mt.race && Mt.race[0] && Mt.race[0].votes > 0,
        )
      : null;
  return {
    ...ctx,
    Ct,
    xt,
    Bt,
    ve,
    Ke,
  };
}
function temMunicipios(e, n, i, _) {
  return e === "pres" && (n !== "uf" || !!i) && !_;
}
function obterCandidato(e, n, a) {
  return e === "pres" && n === "cand" && a != null ? lt[a] : null;
}
function obterLocais(c, _, e, Y, t) {
  return c != null && !_ && e === "pres" && !Y ? En(t, c) : null;
}
function obterZonasDisponiveis(Bt, c, _, e, Y, T, t) {
  return !Bt &&
    c != null &&
    !_ &&
    e === "pres" &&
    !Y &&
    !(T && !T.zone) &&
    !vn(t, c)
    ? wt(t, c)
    : null;
}
