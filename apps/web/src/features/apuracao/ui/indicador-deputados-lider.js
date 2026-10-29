import { Rs } from './composicao-legislativa-1.js';
import { Ms } from './deputados-1.js';
export const implementar = (t) => {
  const e = Rs.data.br,
    n = e && (Ms.k === 'e' ? e.ue : e.uf),
    s = n && n[t];
  return s && s.mais && s.pst > 0 ? s.mais : null;
};
