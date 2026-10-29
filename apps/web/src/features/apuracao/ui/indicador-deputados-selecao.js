import { Ms } from './deputados-1.js';
import { Rs } from './composicao-legislativa-1.js';
export const implementar = (t) => {
  Ms.k !== t && ((Ms.k = t), Rs.subs.forEach((e) => e()));
};
