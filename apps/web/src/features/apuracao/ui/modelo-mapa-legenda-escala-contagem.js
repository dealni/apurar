import { zt } from './municipios-e-distritos-2.js';
import { lt, Dt, pe, ct, Z } from './formatacao-e-acessibilidade-1.js';
import { qi } from './mapa-dados-2.js';
import { Cs, Nn, bn, hs, tt, Ks, Kn } from './apuracao-e-votos-1.js';
import { Geo } from '../geography.js';
import { Sim } from '../simulation.js';
import { mc } from './deputados-1.js';
export function contarEscala(ctx) {
  const q = ctx.E ? qi(ctx.t, ctx.a) : null;
  const contagem = ctx.E
    ? contarCandidato({
        ...ctx,
        q,
      })
    : (contarPartidos(ctx),
      {
        we: 0,
        Ae: null,
        D: 0,
      });
  return {
    ...ctx,
    ...contagem,
    q,
  };
}
function encontrarMaisForte(itens, apuracao, participacao, nome) {
  let id = -1,
    max = 0;
  for (const item of itens)
    if (apuracao(item) > 0 && participacao(item) > max) {
      max = participacao(item);
      id = item;
    }
  return id < 0 ? null : [nome(id), max];
}
function contarCandidato(ctx) {
  if (ctx.Ke)
    return {
      D: ctx.Ke.length,
      we: ctx.Ke.filter((item) => item.race[0].k === ctx.a).length,
      Ae: null,
    };
  return ctx._ ? contarCandidatoExterior(ctx) : contarCandidatoBrasil(ctx);
}
function contarCandidatoExterior({ t, a, l, q }) {
  const pais = l && Cs(l),
    cidades = pais ? pais.cities : Nn;
  let D = 0,
    we = 0;
  for (const cidade of cidades)
    if (bn(t, cidade) > 0) {
      D++;
      if (hs(t, cidade) === a) we++;
    }
  const Ae =
    !we && !(q.wait || q.off)
      ? encontrarMaisForte(
          cidades,
          (cidade) => bn(t, cidade),
          q.zz,
          (cidade) => 'em ' + zt.cities[cidade].name,
        )
      : null;
  return {
    D,
    we,
    Ae,
  };
}
function contarCandidatoBrasil({ t, a, i, q }) {
  const municipios = i ? Geo.ufs[i].munis : tt;
  let D = 0,
    we = 0;
  for (const municipio of municipios)
    if (Dt(t, municipio) > 0) {
      D++;
      if (pe(t, municipio) === a) we++;
    }
  if (!t.towns)
    D = (i ? [i] : Sim.UFS).filter((uf) => t.ufs[uf].pst > 0).length;
  const Ae = we ? null : obterMelhorLocal(t, i, q, municipios);
  return {
    D,
    we,
    Ae,
  };
}
function obterMelhorLocal(t, i, q, municipios) {
  if (!i)
    return encontrarMaisForte(
      Sim.UFS,
      (uf) => t.ufs[uf].pst,
      (uf) => q.ofUF(t.ufs[uf]).share,
      ct,
    );
  if (q.wait || q.off) return null;
  return encontrarMaisForte(
    municipios,
    (municipio) => Dt(t, municipio),
    q.br,
    (municipio) => 'em ' + Geo.munis[municipio].name,
  );
}
function contarPartidos(ctx) {
  if (ctx._) return contarExterior(ctx);
  if (ctx.Y) return contarVantagens(ctx);
  if (ctx.Bt) {
    for (const item of ctx.Bt) ctx.gt(item.list[0]);
    return;
  }
  if (ctx.Ke) {
    for (const item of ctx.Ke) ctx.gt(item.race[0]);
    return;
  }
  if (ctx.j) return contarMunicipios(ctx);
  if (ctx.e === 'dep') return contarDeputados(ctx);
  return contarEstados(ctx);
}
function contarExterior({ t, l, gt }) {
  const pais = l && Cs(l);
  for (const cidade of pais ? pais.cities : Nn)
    if (bn(t, cidade) > 0) gt(lt[hs(t, cidade)]);
}
function contarVantagens({ t, i, z }) {
  for (const municipio of i ? Geo.ufs[i].munis : tt) {
    const votos = Z(t, municipio);
    if (!(votos > 0)) continue;
    const candidato = lt[pe(t, municipio)],
      item = z.get(candidato.partido) || {
        c: candidato,
        n: 0,
      };
    item.n += votos;
    z.set(candidato.partido, item);
  }
}
function contarMunicipios({ t, i, gt }) {
  for (const municipio of i ? Geo.ufs[i].munis : tt)
    if (Dt(t, municipio) > 0) gt(lt[pe(t, municipio)]);
}
function contarDeputados({ gt }) {
  for (const uf of Sim.UFS) {
    const partido = mc(uf);
    if (partido)
      gt({
        partido,
      });
  }
}
function contarEstados({ t, e, gt }) {
  for (const uf of Sim.UFS) {
    const estado = t.ufs[uf];
    if (estado.pst <= 0 || !Ks(estado, e)) continue;
    const candidatos = Kn(estado, e).filter((candidato) => !candidato.anulado);
    if (candidatos.length) {
      gt(candidatos[0]);
      if (e === 'sen' && candidatos[1]) gt(candidatos[1]);
    }
  }
}
