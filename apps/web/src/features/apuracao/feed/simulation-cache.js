import { Sim } from '../simulation.js';
/*
 * Feed preservado: simulation-cache.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createSimulationCache() {
  const simulationCache = new Map();
  const simulationAt = (p) => {
    if (simulationCache.has(p)) {
      const Q = simulationCache.get(p);
      return (simulationCache.delete(p), simulationCache.set(p, Q), Q);
    }
    const L = Sim.at(p);
    return (
      simulationCache.set(p, L),
      simulationCache.size > 12 &&
        simulationCache.delete(simulationCache.keys().next().value),
      L
    );
  };
  return {
    simulationAt,
  };
}
