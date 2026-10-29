import { lt, Ee } from './formatacao-e-acessibilidade-1.js';
import { Da } from './paineis-e-projecoes-1.js';
import { desenharNotas, legendaDoMapa, tituloDoMapa } from './exportacao-legendas.js';
import { Feed } from '../feed.js';
export function criarExportacaoDeImagem({ be, s, office = 'pres', focus = null }) {
  return async () => {
    await document.fonts.load('600 26px "Apurar Sans"');
    const I = [...document.querySelectorAll('canvas.map')].filter(
      (Dn) => !Dn.classList.contains('prev') && Dn.width > 0 && Dn.height > 0,
    );
    if (!I.length) return null;
    const K = I[0].width,
      te = I[0].height,
      ne = Math.max(1, K / Math.max(1, I[0].clientWidth)),
      Qe = document.createElement('canvas');
    ((Qe.width = K), (Qe.height = te));
    const js = Qe.getContext('2d');
    if (!js) return null;
    for (const Dn of I) js.drawImage(Dn, 0, 0, K, te);
    let [fs, pn, bs, ys] = medirLimitesDoMapa(js, K, te);
    (bs <= fs || ys <= pn) && ((fs = 0), (pn = 0), (bs = K - 1), (ys = te - 1));
    const jn = Math.round(28 * ne),
      eo = Math.round(720 * ne);
    if (
      ((fs = Math.max(0, fs - jn)),
      (pn = Math.max(0, pn - jn)),
      (bs = Math.min(K, bs + jn)),
      (ys = Math.min(te, ys + jn)),
      bs - fs < eo)
    ) {
      const Dn = (fs + bs) / 2;
      ((fs = Math.max(0, Math.round(Dn - eo / 2))),
        (bs = Math.min(K, fs + eo)));
    }
    const ks = bs - fs,
      co = ys - pn,
      Ns = document.createElement('canvas');
    Ns.width = Math.round(Math.max(ks, 720 * ne));
    const Qn = Ns.getContext('2d');
    if (!Qn) return null;
    const is = document.querySelector('.crumbs'),
      Es = tituloDaExportacao({
        is,
      }),
      cs = office === 'pres' && focus !== 'ZZ' ? be && be.n : null,
      no = cs && cs.order ? cs.order : [],
      ko = possuiDisputaApurada({
        cs,
        no,
      }),
      Zn = (Dn) => (lt[Dn] && (lt[Dn].exib || lt[Dn].name)) || '',
      ta = legendaDaExportacao({
        ko,
        Es,
        Zn,
        no,
        cs,
      });
    const header = [
      { text: 'Apuração 2026 · ' + Es, size: 26, bold: true, color: '#f7f8f8' },
      { text: 'ARQUIVO · 1º TURNO · DADOS PRESERVADOS', size: 19, bold: true, color: '#d9b57b' },
      { text: cs ? 'Presidente · ' + ta : null, size: 21, color: '#d0d6e0' },
    ];
    const footer = [
      ...legendaDoMapa(),
      { text: 'Data e hora da fonte: ' + horarioDoArquivo(be?.t ?? s) + ' (Brasília) · ' + location.host, size: 17 },
    ];
    const headerBottom = desenharNotas(Qn, header, Ns.width, ne, 28 * ne);
    const footerStart = headerBottom + co + 24 * ne;
    Ns.height = Math.ceil(desenharNotas(Qn, footer, Ns.width, ne, footerStart) + 18 * ne);
    Qn.fillStyle = '#08090a';
    Qn.fillRect(0, 0, Ns.width, Ns.height);
    Qn.textBaseline = 'top';
    desenharNotas(Qn, header, Ns.width, ne, 28 * ne);
    Qn.drawImage(Qe, fs, pn, ks, co, (Ns.width - ks) / 2, headerBottom, ks, co);
    Qn.strokeStyle = '#23252a';
    Qn.beginPath();
    Qn.moveTo(24 * ne, footerStart - 12 * ne);
    Qn.lineTo(Ns.width - 24 * ne, footerStart - 12 * ne);
    Qn.stroke();
    desenharNotas(Qn, footer, Ns.width, ne, footerStart);
    return new Promise((resolve) => {
      try {
        Ns.toBlob((blob) => resolve(blob || null), 'image/png');
      } catch {
        resolve(null);
      }
    });
  };
}
function legendaDaExportacao({ ko, Es, Zn, no, cs }) {
  return ko
    ? `${Es === 'Brasil' ? '' : 'Brasil · '}${Zn(no[0])} ${Ee(cs.cand[no[0]] / cs.valid)} · ${Zn(no[1])} ${Ee(cs.cand[no[1]] / cs.valid)} · ${Da(cs.pst)} das seções`
    : `${Da(cs ? cs.pst : 0)} das seções apuradas`;
}
function tituloDaExportacao() {
  return tituloDoMapa();
}
function possuiDisputaApurada({ cs, no }) {
  return cs && cs.valid > 0 && no.length >= 2;
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

function horarioDoArquivo(minutes) {
  const time = Date.parse(`${Feed.CFG.dia}T00:00:00-03:00`) + minutes * 60000;
  return Number.isFinite(time)
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date(time))
    : 'indisponível';
}
