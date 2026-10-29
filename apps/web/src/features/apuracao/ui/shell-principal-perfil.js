import { useAtalhosDaTela } from './tela-atalhos.js';
import { Geo } from '../geography.js';
import {
  useMemo,
  Te,
  useState,
  useEffect,
} from './formatacao-e-acessibilidade-1.js';
import { Sim } from '../simulation.js';
import { configurarPerfilDoCandidato } from './tela-perfil-candidato.js';

export function usePerfilEAtalhos({
  g,
  Ds,
  i,
  w,
  x,
  go,
  l,
  d,
  On,
  ms,
  De,
  $,
  Xe,
  h,
  f,
}) {
  const yn = g ? Ds.o : i.office,
    Rn = g ? null : i.focus,
    Bn = g ? null : i.country,
    ye = g ? null : i.town;
  useAtalhosDaTela({
    g,
    w,
    x,
    go,
    l,
    d,
    On,
    i,
    ms,
    De,
  });
  const cn = (I) => {
      g || De(yn, I);
    },
    As = (I) => {
      g || De(yn, Geo.munis[I].uf, I === i.town ? null : I);
    },
    Us = useMemo(
      () => Sim.UFS.slice().sort((I, K) => Te[I].localeCompare(Te[K], 'pt-BR')),
      [],
    ),
    rs = (I) => {
      if (!Rn) return;
      const K = Us.indexOf(Rn);
      De(yn, Us[(K + I + Us.length) % Us.length]);
    },
    [Ss, en] = useState(null),
    [fn, vs] = useState(null);
  useEffect(() => {
    if (!Ss) return;
    const I = setTimeout(() => en(null), 4e3);
    return () => clearTimeout(I);
  }, [Ss]);
  const io = yn + (Rn || '') + (ye == null ? '' : ye) + (Bn || ''),
    xs = fn && !g && fn.at === io ? fn : null;
  configurarPerfilDoCandidato({
    g,
    Rn,
    yn,
    vs,
    xs,
    $,
    Xe,
    h,
    f,
    De,
    io,
  });

  return { yn, Rn, Bn, ye, cn, As, Us, rs, Ss, en, fn, vs, io, xs };
}
