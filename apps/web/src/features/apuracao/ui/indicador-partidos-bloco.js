import { fc } from './composicao-legislativa-1.js';
import { a1 } from './composicao-legislativa-1.js';
import { dc } from './composicao-legislativa-1.js';
export const implementar = (t) => {
  const e = String(t || '')
      .toUpperCase()
      .replace(/[\s.]/g, ''),
    n = fc[e] || e;
  if (a1.has(n)) return 'c';
  const s = dc[n];
  return s == null ? null : s < 5 ? 'l' : 'r';
};
