import { Sim } from '../simulation.js';
import { Geo } from '../geography.js';
import { zt } from './municipios-e-distritos-2.js';
import { Uo, zi } from './mapa-dados-1.js';

function dimensoesBase(compacto, ampliado) {
  if (compacto) return [24, 15];
  return ampliado ? [52, 40] : [44, 30];
}

function espacamento(lateral, classificar, ampliado) {
  if (lateral) return 18;
  if (classificar) return ampliado ? 34 : 28;
  return ampliado ? 30 : 24;
}

function dimensoesEstado(uf, contexto) {
  const { classificar, ampliado, largura, altura } = contexto;
  if (!classificar) return [largura, altura];
  const classe = classificar(uf);
  if (classe >= 2) return ampliado ? [64, 54] : [52, 44];
  if (classe === 1) return ampliado ? [42, 70] : [36, 56];
  return ampliado ? [30, 18] : [24, 14];
}

function criarContexto(
  transformacao,
  janela,
  lateral,
  ampliado,
  prioridade,
  classificar,
  offsets,
  localizar,
) {
  const compacto = lateral || prioridade;
  const [largura, altura] = dimensoesBase(compacto, ampliado);
  const contexto = {
    transformacao,
    janela,
    lateral,
    ampliado,
    compacto,
    largura,
    altura,
    classificar,
    offsets,
    localizar,
    itens: [],
    passo: ampliado ? 5 : 4,
    espacamento: espacamento(lateral, classificar, ampliado),
  };
  contexto.dimensoes = (uf) => dimensoesEstado(uf, contexto);
  return contexto;
}

function cabe(x, y, largura, altura, contexto) {
  const { janela, itens } = contexto;
  return (
    y - altura / 2 >= janela.y0 - 30 &&
    y + altura / 2 <= janela.y1 &&
    !itens.some((item) => sobrepoe(item, x, y, largura, altura))
  );
}

function sobrepoe(item, x, y, largura, altura) {
  return (
    Math.abs(item.x - x) < (item.w + largura) / 2 &&
    Math.abs(item.y - y) < (item.h + altura) / 2
  );
}

function pertence(uf, x, y, contexto) {
  if (!Uo) return true;
  const t = contexto.transformacao;
  return contexto.localizar((x - t.ox) / t.k, (y - t.oy) / t.k) === uf;
}

function procurarPosicao(uf, x, y, largura, altura, contexto) {
  if (cabe(x, y, largura, altura, contexto)) return [x, y];
  let alternativa = null;
  let distanciaAlternativa = 0;
  for (const [dx, dy] of contexto.offsets) {
    const distancia = Math.hypot(dx, dy);
    if (alternativa && distancia > distanciaAlternativa + 6) break;
    const px = x + dx * contexto.passo;
    const py = y + dy * contexto.passo;
    if (
      !cabe(px, py, largura, altura, contexto) ||
      !pertence(uf, px, py, contexto)
    )
      continue;
    if (
      pertence(uf, px, py - altura / 4, contexto) &&
      pertence(uf, px, py + altura / 4, contexto)
    )
      return [px, py];
    if (!alternativa) {
      alternativa = [px, py];
      distanciaAlternativa = distancia;
    }
  }
  return alternativa;
}

function centro(uf, transformacao) {
  return {
    uf,
    x: transformacao.ox + Geo.ufs[uf].c[0] * transformacao.k,
    y: transformacao.oy + Geo.ufs[uf].c[1] * transformacao.k,
  };
}

function porArea(a, b) {
  return Geo.ufs[a.uf].km2 - Geo.ufs[b.uf].km2;
}

function distribuirInternos(contexto) {
  const { janela, largura, altura, itens } = contexto;
  Sim.UFS.map((uf) => centro(uf, contexto.transformacao))
    .filter(
      (item) =>
        item.x > janela.x0 + largura &&
        item.x < janela.x1 - largura &&
        item.y > janela.y0 + altura / 2 &&
        item.y < janela.y1 - altura,
    )
    .sort(porArea)
    .forEach((item) => {
      const [w, h] = contexto.dimensoes(item.uf);
      const posicao = procurarPosicao(item.uf, item.x, item.y, w, h, contexto);
      if (posicao) itens.push({ ...item, x: posicao[0], y: posicao[1], w, h });
    });
}

function liberarMenores(item, w, h, contexto, fila) {
  const { itens } = contexto;
  const menores = contexto.compacto
    ? itens.filter((outro) => Geo.ufs[outro.uf].pop < Geo.ufs[item.uf].pop)
    : [];
  let posicao = procurarPosicao(item.uf, item.x, item.y, w, h, contexto);
  if (posicao || !menores.length) return posicao;
  const restantes = itens.filter((outro) => !menores.includes(outro));
  itens.length = 0;
  itens.push(...restantes);
  posicao = procurarPosicao(item.uf, item.x, item.y, w, h, contexto);
  for (const outro of menores) {
    if (posicao && sobrepoe(outro, posicao[0], posicao[1], w, h)) {
      fila.push({ uf: outro.uf, x: outro.lx, y: outro.ly });
    } else itens.push(outro);
  }
  return posicao;
}

function distribuirPrincipais(contexto) {
  const fila = Sim.UFS.filter((uf) => !zi.includes(uf))
    .map((uf) => centro(uf, contexto.transformacao))
    .sort(porArea);
  for (let rodada = 0; fila.length && rodada < 120; rodada++) {
    const item = fila.shift();
    const [w, h] = contexto.dimensoes(item.uf);
    const posicao = liberarMenores(item, w, h, contexto, fila);
    if (posicao || !contexto.compacto)
      contexto.itens.push({
        ...item,
        x: posicao ? posicao[0] : item.x,
        y: posicao ? posicao[1] : item.y,
        lx: item.x,
        ly: item.y,
        w,
        h,
      });
  }
}

function distribuirLaterais(contexto, reserva, exterior) {
  const {
    transformacao: t,
    janela,
    lateral,
    itens,
    espacamento: intervalo,
    altura,
  } = contexto;
  const x = Math.min(
    janela.x1 - reserva + (lateral ? 12 : 16),
    t.ox + Geo.box[2] * t.k + (lateral ? 16 : 24),
  );
  let anterior = -1e9;
  zi.map((uf) => ({
    uf,
    ax: t.ox + Geo.ufs[uf].c[0] * t.k,
    ay: t.oy + Geo.ufs[uf].c[1] * t.k,
  }))
    .sort((a, b) => a.ay - b.ay)
    .forEach((item) => {
      const y = Math.max(item.ay, anterior + intervalo + 3);
      anterior = y;
      itens.push({ ...item, x, y, side: true });
    });
  if (exterior && zt)
    itens.push({
      uf: 'ZZ',
      x,
      y: Math.min(
        janela.y1 - altura / 2,
        anterior + intervalo + (lateral ? 10 : 16),
      ),
      side: true,
      ext: true,
    });
}

export function criarDistribuidor(offsets, localizar) {
  return (t, e, n, s, a = false, r = false, u = null, i = false, c = false) => {
    const contexto = criarContexto(t, e, s, a, r, u, offsets, localizar);
    if (c) distribuirInternos(contexto);
    else {
      distribuirPrincipais(contexto);
      distribuirLaterais(contexto, n, i);
    }
    return contexto.itens;
  };
}
