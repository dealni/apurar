import { html } from './formatacao-e-acessibilidade-1.js';
import { yd } from './painel-de-resultados-1.js';
import { Feed } from '../feed.js';
import { oc } from './mapa-dicas-e-legenda-1.js';
export function renderConteudoApuracao({
  be,
  s,
  e,
  r,
  Ct,
  Ae,
  gs,
  D,
  yn,
  Rn,
  ye,
  Bn,
  g,
  Ds,
  $,
  xo,
  Xe,
  ds,
  bo,
  Jn,
  lo,
  ms,
  cn,
  As,
  De,
  rs,
  go,
  sn,
  ke,
  W,
  ze,
  In,
  Vs,
  w,
  x,
  da,
  l,
  d,
  Ss,
  xs,
  Ge,
  i,
  Ro,
  M,
  S,
  as,
  Qo,
  On,
  He,
  on,
  z,
}) {
  return html`<${yd}
    m=${be}
    t=${s}
    clock=${e}
    live=${r}
    conn=${Ct}
    notice=${Ae}
    onShare=${criarCompartilhamento({
      gs,
      D,
    })}
    office=${yn}
    focus=${Rn}
    town=${ye}
    country=${Bn}
    level=${g ? Ds.lv : Feed.LIVE && !r && oc.has($) ? 'mun' : $}
    setLevel=${xo}
    cand=${Xe}
    setCand=${ds}
    replay=${Feed.LIVE && !r}
    pickCity=${bo}
    pickCountry=${Jn}
    toAbroad=${lo}
    upFromCity=${ms}
    pick=${cn}
    pickTown=${As}
    close=${() => De(yn, null)}
    toState=${() => De(yn, Rn)}
    step=${rs}
    setOffice=${go}
    onScrub=${sn}
    onLive=${ke}
    onForward=${W}
    playing=${ze}
    onPlay=${In}
    onTV=${Vs}
    onSearch=${() => w(!0)}
    searchOpen=${x && !g}
    onSearchClose=${() => w(!1)}
    onChoose=${da}
    about=${l}
    setAbout=${d}
    openIn=${(I, K) => De(I, K)}
    spot=${Ss && !g && Ss.at === yn + (Rn || '') + (ye == null ? '' : ye) ? Ss : null}
    prof=${xs}
    onProfClose=${Ge}
    zoneN=${g ? null : i.zone || null}
    onZoneN=${Ro}
    tv=${g}
    toast=${M}
    onToast=${() => S(null)}
    ev=${as}
    idle=${Qo}
    onExit=${On}
    cam=${He}
    onCam=${on}
    intro=${z}
  />`;
}
let compartilhamentoEmAndamento = false;
function criarCompartilhamento({ gs, D }) {
  return async () => {
    if (compartilhamentoEmAndamento) return;
    compartilhamentoEmAndamento = true;
    try {
      await executarCompartilhamento({ gs, D });
    } finally {
      compartilhamentoEmAndamento = false;
    }
  };
}
async function executarCompartilhamento({ gs, D }) {
    const I = location.href;
    let K;
    try {
      K = await gs();
    } catch {
      K = null;
    }
    const te =
      K && typeof File == 'function'
        ? new File([K], 'apuracao-2026.png', {
            type: 'image/png',
          })
        : null;
    if (await compartilharArquivo(te, I)) return;
    if (await compartilharLink(te, I)) return;
    if (te) {
      const ne = URL.createObjectURL(K),
        Je = document.createElement('a');
      ((Je.href = ne),
        (Je.download = te.name),
        document.body.appendChild(Je),
        Je.click(),
        Je.remove(),
        setTimeout(() => URL.revokeObjectURL(ne), 1e4));
    }
    try {
      (await navigator.clipboard.writeText(I),
        D(te ? 'Imagem salva e link copiado.' : 'Link copiado.'));
    } catch {
      D(te ? `Imagem salva. Não foi possível copiar o link: ${I}` : `Não foi possível copiar o link: ${I}`);
    }
}

async function compartilharArquivo(arquivo, url) {
  try {
    if (
      !arquivo ||
      !navigator.share ||
      !navigator.canShare ||
      !navigator.canShare({ files: [arquivo] })
    )
      return false;
    await navigator.share({
      title: document.title,
      text: document.title + ' ' + url,
      files: [arquivo],
    });
    return true;
  } catch (erro) {
    return !!erro && erro.name === 'AbortError';
  }
}
async function compartilharLink(arquivo, url) {
  try {
    if (!navigator.share || arquivo) return false;
    await navigator.share({ title: document.title, url });
    return true;
  } catch (erro) {
    return !!erro && erro.name === 'AbortError';
  }
}
