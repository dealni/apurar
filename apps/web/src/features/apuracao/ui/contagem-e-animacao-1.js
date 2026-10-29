import { Fn, dt, bn, Re } from './apuracao-e-votos-1.js';
import { ma, Is, to, Un, ci } from './eventos-e-progresso-1.js';
import {
  lt,
  yt,
  Pe,
  html,
  Oe,
  Dt,
  useRef,
  ge,
  ie,
  useLayoutEffect,
  useEffect,
  useState,
} from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';
import { Sim } from '../simulation.js';
import { Ln } from './municipios-e-distritos-2.js';
export let pi, pu, Mo, $u, hu, $o, mu, qn, hi, Bo, ho, ra, vu, hr, tn, Ao, Ia;
export const $iState = {
  value: undefined,
};
export const $rState = {
  value: undefined,
};
export const plState = {
  value: undefined,
};
export const miState = {
  value: undefined,
};
export function initialize() {
  initializeHistoricalTransitions();
  initializeArrivalTimes();
  initializeRollingDigits();
  initializeAnimationClock();
  initializeAnimatedNumber();
  initializeResizeHook();
  initializePositionAnimation();
}

function initializeHistoricalTransitions() {
  pi = (t, e, n) => {
    if (!(e.lead !== t.lead && e.pst >= 0.05 && n.lead === e.lead)) return null;
    const s = t.sh[e.lead] - t.sh[t.lead],
      a = e.sh[e.lead] - e.sh[t.lead],
      r = s === a ? 1 : -s / (a - s);
    return {
      t: e.t,
      from: t.lead,
      to: e.lead,
      pst: e.pst,
      xpst: t.pst + (e.pst - t.pst) * r,
      xsh: t.sh[e.lead] + (e.sh[e.lead] - t.sh[e.lead]) * r,
    };
  };
  pu = (t) => {
    const e = Fn.length ? Fn[0].t : 1 / 0,
      n = t
        .filter((s) => s.t < e)
        .map((s) => {
          const a = s.sh.map((r, u) => [r, u]).sort((r, u) => u[0] - r[0]);
          return {
            t: s.t,
            pst: s.pst,
            sh: s.sh,
            lead: a[0][1],
            second: a[1][1],
            status: s.status,
            part: !0,
          };
        });
    if (!n.length) return !1;
    (Fn.unshift(...n), (ma.length = 0));
    for (let s = Is.length - 1; s >= 0; s--)
      Is[s].big === 'virada' && Is.splice(s, 1);
    for (let s = 2; s < Fn.length; s++) {
      const a = pi(Fn[s - 2], Fn[s - 1], Fn[s]);
      a &&
        (ma.push(a),
        to({
          t: a.t,
          big: 'virada',
          cand: lt[a.to],
          v: a,
          say: `${yt(lt[a.to])} passa à frente de ${yt(lt[a.from])}, com ${Pe(a.pst)}% das seções totalizadas.`,
          short: () =>
            html`${Un(lt[a.to])} passa à frente de ${yt(lt[a.from])}`,
          line: () =>
            html`${Un(lt[a.to])} passa à frente de ${yt(lt[a.from])}, com
            ${Pe(a.pst)}% das seções totalizadas.`,
        }));
    }
    return (ci(n.slice().sort((s, a) => s.t - a.t)), !0);
  };
}

function initializeArrivalTimes() {
  Mo = {
    first: new Float32Array(dt).fill(1 / 0),
    done: new Float32Array(dt).fill(1 / 0),
  };
  Feed.LIVE ||
    Sim.ARRIVE.forEach((t, e) => {
      ((Mo.first[e] = t.first), (Mo.done[e] = t.done));
    });
  $iState.value = !1;
  $u = (t) => {
    if (!t.towns) return;
    const e = !$iState.value && t.t > Oe ? -1 / 0 : t.t;
    $iState.value = !0;
    updateMunicipalArrivalTimes(t, e);
    updateDistrictArrivalTimes(t, e);
  };
  hu = (t) => (e, n) => Mo[t][e] - Mo[t][n] || Re[e] - Re[n];
  $o = {
    first: new Float32Array(Ln).fill(1 / 0),
    most: new Float32Array(Ln).fill(1 / 0),
    done: new Float32Array(Ln).fill(1 / 0),
  };
  !Feed.LIVE &&
    Sim.XARRIVE &&
    Sim.XARRIVE.forEach((t, e) => {
      (($o.first[e] = t.first), ($o.most[e] = t.most), ($o.done[e] = t.done));
    });
  mu = (t, e) => $o.first[t] - $o.first[e] || t - e;
  $rState.value = Oe - 1;
  qn = {
    on: !0,
  };
  hi = {
    on: !1,
  };
}

function initializeRollingDigits() {
  Bo = ({ v: t, still: e = !1 }) => {
    const n = String(t),
      s = useRef(null);
    s.current ||
      (s.current = {
        cur: n,
        old: null,
        at: 0,
      });
    const a = s.current;
    a.cur !== n &&
      ((a.old = qn.on && !e && !ge ? a.cur : null),
      (a.cur = n),
      (a.at = performance.now()));
    const r =
        a.old != null && performance.now() - a.at < 1e3 ? [...a.old] : null,
      u = [...n],
      i = u.length,
      c = u.map((l, d) => {
        const $ = i - 1 - d,
          f = r ? r[r.length - 1 - $] : l;
        return {
          ch: l,
          j: $,
          was: f,
          roll: !!r && f !== l,
          n: 0,
        };
      });
    for (let l = c.length - 1, d = 0; l >= 0; l--) c[l].roll && (c[l].n = d++);
    return html`<span class="num"
      ><span class="sr">${n}</span
      >${c.map((l) => html`<span class=${'ch' + (l.roll ? ' roll' : '')} aria-hidden="true" key=${l.j} style=${l.roll ? '--j:' + l.n : null}>${l.roll && l.was != null ? html`<i class="out" key=${'o' + l.was}>${l.was}</i>` : null}<i class=${l.roll ? 'in' : null} key=${'n' + l.ch}>${l.ch}</i></span>`)}</span
    >`;
  };
}

function initializeAnimationClock() {
  ho = {
    dur: 6e3,
  };
  ra = new Set();
  plState.value = 0;
  miState.value = 0;
  vu = (t) => 0.7 * t + 0.3 * t * t * (3 - 2 * t);
  hr = (t) => {
    if (t - miState.value < 30) {
      plState.value = requestAnimationFrame(hr);
      return;
    }
    miState.value = t;
    for (const e of ra) {
      const n = e.d > 0 ? ie((t - e.t0) / e.d, 0, 1) : 1;
      e.v =
        n >= 1
          ? e.b
          : e.a + (e.b - e.a) * (e.intro ? 1 - Math.pow(1 - n, 3) : vu(n));
      const s = e.fmt(e.v);
      (s !== e.s && e.el && ((e.s = s), (e.el.textContent = s)),
        n >= 1 && ra.delete(e));
    }
    plState.value = ra.size ? requestAnimationFrame(hr) : 0;
  };
}

function initializeAnimatedNumber() {
  tn = ({ n: t, fmt: e }) => {
    const n = useRef(null),
      s = useRef(null);
    s.current ||
      (s.current = {
        v: t,
        b: t,
        s: null,
        el: null,
        intro: !1,
      });
    const a = s.current;
    return (
      (a.fmt = e),
      useLayoutEffect(() => {
        if (((a.el = n.current), !a.el)) return;
        configureNumberTransition(a, t);
        const u = e(a.v);
        (u !== a.s && ((a.s = u), (a.el.textContent = u)),
          a.v !== a.b &&
            !ra.has(a) &&
            (ra.add(a),
            plState.value || (plState.value = requestAnimationFrame(hr))));
      }),
      useEffect(
        () => () => {
          ra.delete(a);
        },
        [],
      ),
      html`<span class="num run"
        ><span class="sr">${e(t)}</span><span aria-hidden="true" ref=${n}></span
      ></span>`
    );
  };
}

function initializeResizeHook() {
  Ao = () => {
    const [t, e] = useState(null),
      [n, s] = useState({
        w: 0,
        h: 0,
      });
    return (
      useLayoutEffect(() => {
        if (!t) return;
        const a = () =>
          s((u) =>
            u.w === t.clientWidth && u.h === t.clientHeight
              ? u
              : {
                  w: t.clientWidth,
                  h: t.clientHeight,
                },
          );
        if (typeof ResizeObserver != 'function')
          return (
            a(),
            addEventListener('resize', a),
            () => removeEventListener('resize', a)
          );
        const r = new ResizeObserver(a);
        return (r.observe(t), () => r.disconnect());
      }, [t]),
      [e, n]
    );
  };
}

function initializePositionAnimation() {
  Ia = (t, e, n = !1) => {
    const s = useRef(new Map()),
      a = useRef(!1);
    useLayoutEffect(() => {
      const r = t.current;
      if (!r) return;
      const u = r.getBoundingClientRect(),
        i = u.width / r.offsetWidth || 1,
        c = new Map(),
        l =
          qn.on &&
          !ge &&
          (s.current.size > 0 || (n && a.current)) &&
          typeof r.animate == 'function';
      for (const d of r.children) {
        const $ = d.dataset && d.dataset.k;
        if (!$) continue;
        const f = d.getBoundingClientRect(),
          m = [f.left - u.left, f.top - u.top + r.scrollTop * i];
        if ((c.set($, m), !l)) continue;
        const h = s.current.get($);
        if (!h)
          d.animate(
            [
              {
                opacity: 0,
                transform: 'translateY(8px)',
              },
              {
                opacity: 1,
                transform: 'none',
              },
            ],
            {
              duration: 420,
              delay: 100,
              easing: 'cubic-bezier(.16,1,.3,1)',
              fill: 'backwards',
            },
          );
        else {
          const g = (h[0] - m[0]) / i,
            v = (h[1] - m[1]) / i;
          (Math.abs(g) > 0.5 || Math.abs(v) > 0.5) &&
            d.animate(
              [
                {
                  transform: `translate(${g}px,${v}px)`,
                },
                {
                  transform: 'none',
                },
              ],
              {
                duration: 450,
                easing: 'cubic-bezier(.7,0,.3,1)',
              },
            );
        }
      }
      ((s.current = c), (a.current = !0));
    }, e);
  };
}

function updateMunicipalArrivalTimes(t, e) {
  for (let n = 0; n < dt; n++) {
    const s = Dt(t, n);
    (s > 0 && !(Mo.first[n] <= t.t) && (Mo.first[n] = e),
      s >= 1 && !(Mo.done[n] <= t.t) && (Mo.done[n] = e));
  }
}

function updateDistrictArrivalTimes(t, e) {
  for (let n = 0; n < Ln; n++) {
    const s = bn(t, n);
    (s > 0 && !($o.first[n] <= t.t) && ($o.first[n] = e),
      s >= 0.9 && !($o.most[n] <= t.t) && ($o.most[n] = e),
      s >= 1 && !($o.done[n] <= t.t) && ($o.done[n] = e));
  }
}

function configureNumberTransition(a, t) {
  const r = isFinite(t) && isFinite(a.v) && !ge && !document.hidden;
  a.s == null && hi.on && r && t > 0
    ? ((a.a = a.v = t * 0.9),
      (a.b = t),
      (a.t0 = performance.now() + 450),
      (a.d = 700),
      (a.intro = !0))
    : t !== a.b &&
      (qn.on && r
        ? ((a.a = a.v),
          (a.b = t),
          (a.t0 = performance.now()),
          (a.d = ho.dur),
          (a.intro = !1))
        : (ra.delete(a), (a.v = a.b = t)));
}
