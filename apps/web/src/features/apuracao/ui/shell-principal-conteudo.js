import { blocksPanelShortcut } from "../../../runtime/interaction-guards.ts";
import { useRef, useEffect, vt } from './formatacao-e-acessibilidade-1.js';
import { criarEscolhaDaBusca } from './tela-escolher-busca.js';
import { qn } from './contagem-e-animacao-1.js';
import { Feed } from '../feed.js';
import { criarExportacaoDeImagem } from './tela-exportar-imagem.js';
import { renderConteudoApuracao } from './tela-conteudo.js';

export function renderizarPrincipal(estado) {
  const { fn, vs, $, f, De, yn, Rn, ye, Bn, io, xs, w, Xe, h, r, Y, be, s } =
    estado;
  const Ge = () => {
      const I = fn;
      (vs(null),
        I &&
          I.lv0 &&
          I.lv0 !== 'cand' &&
          $ === 'cand' &&
          (f(I.lv0), De(yn, Rn, ye, I.lv0, Bn)));
    },
    Js = useRef(io);
  (useEffect(() => {
    (fn && Js.current === fn.at && io !== fn.at && vs(null), (Js.current = io));
  }, [io]),
    useEffect(() => {
      if (!xs) return;
      const I = (K) => {
        !blocksPanelShortcut(K) &&
          K.key === 'Escape' &&
          !document.querySelector('.search,.about,.candpick,.acesso') &&
          (K.preventDefault(), K.stopPropagation(), Ge());
      };
      return (
        addEventListener('keydown', I, !0),
        () => removeEventListener('keydown', I, !0)
      );
    }, [xs, $, yn, Rn, ye, Bn]));
  const da = criarEscolhaDaBusca({
    w,
    De,
    yn,
    $,
    Xe,
    vs,
    h,
    f,
  });
  ((qn.on = r && !Y.current),
    (vt.on = Feed.LIVE && !r),
    (vt.bare = Feed.LIVE && !be.towns));
  const gs = criarExportacaoDeImagem({
    be,
    s,
    office: yn,
    focus: Rn,
  });
  return renderConteudoApuracao({ ...estado, gs, Ge, da });
}
