import { Feed } from '../feed.js';
import { Rs } from './composicao-legislativa-1.js';
export const implementar = (t) => {
  if (!Feed.LIVE || !Feed.json) return null;
  const e = Date.now();
  return (
    e - (Rs.at[t] || 0) > Feed.every(2e4) &&
      ((Rs.at[t] = e),
      Feed.json(`deputados/${t.toLowerCase()}.json`).then(
        (n) => {
          n &&
            n.versao === 1 &&
            ((Rs.data[t] = n), Rs.subs.forEach((s) => s()));
        },
        () => {},
      )),
    Rs.data[t] || null
  );
};
