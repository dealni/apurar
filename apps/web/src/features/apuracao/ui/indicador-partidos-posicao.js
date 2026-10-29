import { dc } from './composicao-legislativa-1.js';
import { fc } from './composicao-legislativa-1.js';
export const implementar = (t) => {
  const e = String(t || '')
      .toUpperCase()
      .replace(/[\s.]/g, ''),
    n = dc[fc[e] || e];
  return n == null ? null : n;
};
