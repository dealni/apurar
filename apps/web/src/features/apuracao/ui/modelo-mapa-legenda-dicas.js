import {
  html,
  ie,
  Pe,
  ht,
  Oe,
  ps,
  Xt,
  mt,
  Dt,
  G,
  yt,
  pt,
  Ne,
} from './formatacao-e-acessibilidade-1.js';
import { zt } from './municipios-e-distritos-2.js';
import { _l } from './mapa-interativo-2.js';
import { Rs, Wo } from './composicao-legislativa-1.js';
import { To, os } from './candidatos-e-partidos-1.js';
import { Feed } from '../feed.js';
import { Qt } from './municipios-e-distritos-1.js';
import {
  aa,
  bn,
  so,
  Kn,
  Ks,
  Pa,
  ha,
  Xn,
  No,
  ni,
  ur,
  ol,
  Ie,
  Co,
} from './apuracao-e-votos-1.js';
import { Geo } from '../geography.js';
import { So } from './hud-e-comunicacao-1.js';
import { Ma } from './resultados-municipais-1.js';
export function renderDeputados(l, d, h) {
  const D = Rs.data.br,
    q = D && D.uf && D.uf[l.uf],
    le = q && q.top1;
  return h(
    l.side,
    1,
    html`<div class="th">
        <${To} r=${d} office="pres" plain />
        <div>
          <span class="nm">${d.name}</span
          ><small class="tn"
            >${q ? q.vagas + ' vagas · ' + Pe(q.pst) + '% das seções' : 'Deputados'}</small
          >
        </div>
      </div>
      <p class="note">
        ${le ? html`Mais votado: <b>${le[1]}</b> (${Wo(le[2])}), ${ht(le[3])} votos` : Feed.minuteOf(Date.now()) < Oe ? 'Os votos saem a partir das 17h.' : 'Aguardando os primeiros votos.'}
      </p>`,
  );
}
export function renderZona(l, v, h, u, i) {
  const D = v.race && v.f > 0 ? v.race.filter((ot) => ot.votes > 0) : [],
    q = D.slice(0, 2),
    le = u != null ? D.find((ot) => ot.k === u) : null;
  le && !q.includes(le) && q.push(le);
  const be = i && i.id !== 'apur' && i.zone && v.f > 0 ? i.zone(v) : null;
  return h(
    !1,
    q.length + (be != null ? 1 : 0),
    html`<div class="th">
        <span class="uft plain zt">${v.z}</span>
        <div>
          <span class="nm">${v.nome || 'Zona ' + v.z}</span
          ><small class="tn"
            >${v.nome ? v.z + 'ª zona · ' : ''}${v.f == null ? 'carregando' : Pe(v.f) + '% das seções'}</small
          >
        </div>
      </div>
      ${be != null ? html`<p class="note tn">${ps(i.say(be))}</p>` : null}${q.map((ot) => html`<${os} key=${'z' + l.muni + '.' + l.zone + ot.id} c=${ot} size=${30} cls=${ot === le ? 'spot' : ''} votes />`)}`,
  );
}
export function renderBairro(l, S, M, h, u) {
  const D = S.list.filter((ot) => ot.votes > 0),
    q = D.slice(0, 2),
    le = u != null ? D.find((ot) => ot.k === u) : null;
  le && !q.includes(le) && q.push(le);
  const be =
    Xt === 2
      ? Qt(
          M,
          M.b.map((ot, ke) => ke).filter((ot) => M.b[ot] === l.bairro),
        )
      : null;
  return h(
    !1,
    (q.length || 1) + (be ? 1 : 0),
    html`<div class="th">
        <div>
          <span class="nm">${M.bairros[l.bairro]}</span
          ><small class="tn"
            >${S.n} ${S.n === 1 ? 'local de votação' : 'locais de votação'} ·
            ${mt(S.el)}</small
          >
        </div>
      </div>
      ${q.length ? q.map((ot) => html`<${os} key=${'b' + l.muni + '.' + l.bairro + ot.id} c=${ot} size=${30} cls=${ot === le ? 'spot' : ''} votes />`) : html`<p class="note">Aguardando as primeiras seções.</p>`}${be ? html`<${aa} s=${be} />` : null}`,
  );
}
export function renderLocal(l, x, w, h, u, i, e) {
  const D = l.local,
    q = x.b[D],
    le = w ? w.list.filter((ze) => ze.votes > 0) : [],
    be = le.slice(0, 2),
    ot = u != null ? le.find((ze) => ze.k === u) : null;
  ot && !be.includes(ot) && be.push(ot);
  const ke = obterValorLocal(w, i, x, D, e, l),
    W = Xt === 2 ? Qt(x, D) : null;
  return h(
    !1,
    (be.length || 1) + (ke != null ? 1 : 0) + (W ? 1 : 0),
    html`<div class="th">
        <span class="uft plain zt">${x.z[D]}</span>
        <div>
          <span class="nm">${x.nome[D] || 'Local ' + x.n[D]}</span
          ><small class="tn"
            >${q >= 0 ? x.bairros[q] + ' · ' : ''}${ht(x.sec[D])}
            ${x.sec[D] === 1 ? 'seção' : 'seções'} · ${mt(x.el[D])}</small
          >
        </div>
      </div>
      ${ke != null ? html`<p class="note tn">${ps(i.say(ke))}</p>` : null}${be.length ? be.map((ze) => html`<${os} key=${'l' + l.muni + '.' + D + ze.id} c=${ze} size=${30} cls=${ze === ot ? 'spot' : ''} votes />`) : html`<p class="note">Aguardando as primeiras seções.</p>`}${W ? html`<${aa} s=${W} />` : null}`,
  );
}
export function renderTerritorio(l, e, n, d, $, f, u, i, h) {
  const z = obterProgressoTerritorial($, e, l, f, d),
    gt = obterChaveTerritorial($, l, f, n),
    _ = obterCandidatosComVotos(z, $, e, l, f, d, n),
    j = _.slice(0, 2),
    Y = obterCandidatoDestacado(u, n, _);
  incluirCandidatoDestacado(Y, j);
  const E = $ ? zt.cities[l.city] : null,
    T = obterNomeTerritorial($, E, f, l, d),
    Ct = semDisputaAtual($, f, d, n),
    xt = Ct ? Pa(l.uf) : null,
    Bt = $
      ? html`<span class="uft plain">${E.iso}</span>`
      : l.uf === 'ZZ'
        ? html`<span class="uft plain gl"><${So} size=${12} /></span>`
        : html`<${To} r=${d} office=${n} plain=${f} />`,
    ve = e.live && e.n.pst <= 0 && z <= 0,
    Ke = formatarProgressoTerritorial($, ve, e, E, z),
    we = obterValorTerritorial(i, z, Ct, $, e, l, f, d),
    Ae = obterResumoPrimeiroTurno(n, Ct, $, l, f);
  return h(
    l.side,
    j.length + (ve ? 1 : 0) + (we != null ? 1 : 0) + (Ae ? 1 : 0),
    html`<div class="th">
        ${Bt}
        <div>
          <span class="nm">${T}</span
          >${Ct ? null : html`<small class="tn">${$ ? E.country + ' · ' : ''}${Ke}</small>`}
        </div>
      </div>
      ${we != null ? html`<p class="note tn">${ps(i.say(we))}</p>` : null}
      ${renderAvisoVotos(ve, Ct)} ${renderResultadoGovernador(Ct, xt, l)}
      ${j.map((D) => html`<${os} key=${gt + D.id} c=${D} size=${30} cls=${D === Y ? 'spot' : ''} votes />`)}${Ae ? html`<${aa} s=${Ae} />` : null}${renderComparacaoAnterior(f, l, _, $, n)}`,
  );
}
export function criarPosicionador(c, l, a, m) {
  return (D, q, le) => {
    const be = D ? l.x - _l - 12 : l.x + 18 + _l > m ? l.x - _l - 18 : l.x + 18,
      ot = `left:${ie(be, a.x0, m - _l)}px;top:${ie(D ? l.y - 60 : l.y - 24, a.y0 - 44, a.y1 - 190 - 38 * Math.max(0, q - 2))}px`;
    return (
      (c.current = {
        style: ot,
        inner: le,
      }),
      html`<div class="tip on" style=${ot}>${le}</div>`
    );
  };
}
function obterValorLocal(w, i, x, D, e, l) {
  return w && i && i.id !== 'apur' && i.local
    ? i.local(x, D, w, e, l.muni)
    : null;
}
function renderComparacaoAnterior(f, l, _, $, n) {
  return f && Xn
    ? html`<${No} w=${ni[l.muni]} now=${ur(_)} />`
    : $
      ? html`<${No} w=${ol[l.city]} now=${ur(_)} />`
      : n === 'pres' && Xn && l.uf !== 'ZZ' && Ie.uf[l.uf]
        ? html`<${No} w=${Co(Ie.uf[l.uf])} now=${ur(_)} />`
        : null;
}
function obterValorTerritorial(i, z, Ct, $, e, l, f, d) {
  return i && i.id !== 'apur' && z > 0 && !Ct
    ? $
      ? i.city(e, l.city)
      : f
        ? i.town(e, l.muni)
        : i.uf(d)
    : null;
}
function obterResumoPrimeiroTurno(n, Ct, $, l, f) {
  return n === 'pres' && Xt === 2 && !Ct
    ? $
      ? ha('ZZ', null, l.city)
      : f
        ? ha(null, l.muni)
        : ha(l.uf)
    : null;
}
function obterCandidatosComVotos(z, $, e, l, f, d, n) {
  return z > 0
    ? (($ ? so(e, l.city) : f ? G(e, l.muni) : Kn(d, n)) || []).filter(
        (D) => D.votes > 0,
      )
    : [];
}
function renderResultadoGovernador(Ct, xt, l) {
  return Ct
    ? html`<p class="note">
        ${xt ? `${yt(xt)} ${pt(xt) ? 'foi eleita' : 'foi eleito'} no 1º turno.` : Ne.has(l.uf) ? 'Aguardando os dados do 2º turno.' : 'Sem 2º turno para governador.'}
      </p>`
    : null;
}
function formatarProgressoTerritorial($, ve, e, E, z) {
  return $ && ve
    ? e.t >= E.closes
      ? 'urnas fechadas'
      : 'vota até ' + Ma(E.closes)
    : Pe(z) + '% das seções';
}
function renderAvisoVotos(ve, Ct) {
  return ve && !Ct
    ? html`<p class="note">
        ${Feed.minuteOf(Date.now()) < Oe ? 'Os votos saem a partir das 17h.' : 'Aguardando os primeiros votos.'}
      </p>`
    : null;
}
function obterProgressoTerritorial($, e, l, f, d) {
  return $ ? bn(e, l.city) : f ? Dt(e, l.muni) : d.pst;
}
function obterChaveTerritorial($, l, f, n) {
  return $ ? 'x' + l.city : f ? 'm' + l.muni : 'u' + l.uf + n;
}
function obterCandidatoDestacado(u, n, _) {
  return u != null && n === 'pres' ? _.find((D) => D.k === u) : null;
}
function incluirCandidatoDestacado(Y, j) {
  return Y && !j.includes(Y) && j.push(Y);
}
function obterNomeTerritorial($, E, f, l, d) {
  return $ ? E.name : f ? Geo.munis[l.muni].name : d.name;
}
function semDisputaAtual($, f, d, n) {
  return !$ && !f && !Ks(d, n);
}
