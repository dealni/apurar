import { useState } from './formatacao-e-acessibilidade-1.js';
import { useEffect } from './formatacao-e-acessibilidade-1.js';
import { Rs } from './composicao-legislativa-1.js';
import { wa } from './deputados-1.js';
export const implementar = (t) => {
  const [, e] = useState(0);
  return (
    useEffect(() => {
      const n = () => e((a) => a + 1);
      (Rs.subs.add(n), wa(t));
      const s = 0;
      return () => {
        (Rs.subs.delete(n), clearInterval(s));
      };
    }, [t]),
    wa(t)
  );
};
