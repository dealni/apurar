import { describe, expect, it, vi } from "vitest";

const { effects } = vi.hoisted(() => ({ effects: [] as (() => void)[] }));
vi.mock("../features/projetar/ui/formatacao-e-acessibilidade-1.js", () => ({
  useEffect: (effect: () => void) => effects.push(effect),
  je: 1380,
}));
vi.mock("../features/projetar/feed.js", () => ({ Feed: { LIVE: true } }));
vi.mock("../features/projetar/ui/contagem-e-animacao-1.js", () => ({
  $rState: { value: 1020 },
}));
vi.mock("../features/projetar/ui/eventos-e-progresso-2.js", () => ({
  fi: vi.fn(),
}));
vi.mock("../features/projetar/ui/estado-e-navegacao-1.js", () => ({
  Md: vi.fn(),
  Qa: vi.fn(),
}));
vi.mock("../features/projetar/ui/eventos-e-progresso-1.js", () => ({ Is: [] }));
vi.mock("../features/projetar/ui/painel-de-resultados-2.js", () => ({ Cd: 0 }));

// @ts-expect-error O hook visual legado é JavaScript sem declaração de tipos.
import { useRelogioEHistorico } from "../features/projetar/ui/tela-relogio-e-historico.js";

function pendingLiveFollow() {
  effects.length = 0;
  const selectMinute = vi.fn();
  const replayCursor = { current: null as number | null };
  useRelogioEHistorico({
    e: 1080,
    s: 1020,
    r: true,
    a: selectMinute,
    j: { current: 0 },
    T: replayCursor,
  });
  return { selectMinute, replayCursor, runEffect: effects[2]! };
}

describe("atualização do cursor ao vivo", () => {
  it("acompanha a fonte enquanto não há corte histórico selecionado", () => {
    const { selectMinute, runEffect } = pendingLiveFollow();
    runEffect();
    expect(selectMinute).toHaveBeenCalledWith(1080);
  });

  it("preserva o corte escolhido depois do render e antes do efeito pendente", () => {
    const { selectMinute, replayCursor, runEffect } = pendingLiveFollow();
    // Home seleciona o corte sincronicamente; o efeito ainda capturou r=true.
    replayCursor.current = 1020;
    runEffect();
    expect(selectMinute).not.toHaveBeenCalled();
  });
});
