import { blocksPanelShortcut } from "../../../runtime/interaction-guards.ts";
import { useEffect } from './formatacao-e-acessibilidade-1.js';
export function useFecharBairroAoEsc({ is, Qn }) {
  useEffect(() => {
    if (is == null) return;
    const Ce = (Mn) => {
      !blocksPanelShortcut(Mn) &&
        Mn.key === 'Escape' &&
        !document.querySelector('.search,.about,.candpick,.acesso') &&
        (Mn.stopPropagation(), Qn(null));
    };
    return (
      addEventListener('keydown', Ce, !0),
      () => removeEventListener('keydown', Ce, !0)
    );
  }, [is]);
}
