import { ie, Oe } from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';

export function createTimelineInteractions({ d, $, _, r, n, a, s, g, z, t, cursor }) {
  const E = (ot) => {
      const ke = d.current.getBoundingClientRect();
      return Oe + ie((ot.clientX - ke.left) / ke.width, 0, 1) * (_ - Oe);
    },
    T = !Feed.LIVE && r,
    Ct = (ot) =>
      T && ot > n + 1
        ? r(Math.min(_, Math.floor(ot)))
        : ot >= n - 1
          ? a()
          : s(Math.max(Oe, Math.floor(ot))),
    xt = (ot) => {
      if (!ot.target.closest('.pin')) {
        if (ot.pointerType === 'touch') {
          $.current = {
            x: ot.clientX,
            y: ot.clientY,
            id: ot.pointerId,
            on: !1,
          };
          return;
        }
        (ot.currentTarget.setPointerCapture(ot.pointerId), Ct(E(ot)));
      }
    },
    Bt = (ot) => {
      const ke = $.current;
      if (ke && ot.pointerId === ke.id) {
        const W = ot.clientX - ke.x,
          ze = ot.clientY - ke.y;
        if (!ke.on && Math.abs(W) > 8 && Math.abs(W) > Math.abs(ze)) {
          ke.on = !0;
          try {
            ot.currentTarget.setPointerCapture(ot.pointerId);
          } catch {
            /* Fallback opcional preservado da captura; a interface continua disponível. */
          }
        }
        ke.on && Ct(E(ot));
        return;
      }
      (g(T ? E(ot) : Math.min(z, E(ot))),
        ot.currentTarget.hasPointerCapture &&
          ot.currentTarget.hasPointerCapture(ot.pointerId) &&
          Ct(E(ot)));
    },
    ve = (ot) => {
      const ke = $.current;
      (($.current = null),
        ke &&
          ot.pointerId === ke.id &&
          !ke.on &&
          ot.type === 'pointerup' &&
          Math.hypot(ot.clientX - ke.x, ot.clientY - ke.y) < 10 &&
          Ct(E(ot)));
    },
    Ke = (ot) => {
      if (ot.target !== ot.currentTarget) return;
      const step = {
        ArrowLeft: -1,
        ArrowRight: 1,
        PageDown: -15,
        PageUp: 15,
      }[ot.key];
      if (!step && ot.key !== "Home" && ot.key !== "End") return;
      ot.preventDefault();
      const maximum = T ? _ : Math.floor(z);
      const next = ot.key === "Home"
        ? Oe
        : ot.key === "End"
          ? maximum
          : ie((cursor?.current ?? t) + step * (ot.shiftKey ? 10 : 1), Oe, maximum);
      if (cursor) cursor.current = next;
      T && next > n ? r(next) : next >= n ? a() : s(next);
    };
  return { T, xt, Bt, ve, Ke };
}
