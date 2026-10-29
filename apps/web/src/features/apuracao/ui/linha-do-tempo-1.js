import {
  useState,
  useEffect,
  useRef,
  useMemo,
  je,
  ie,
  Oe,
} from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';
import { Ao } from './contagem-e-animacao-1.js';
import { mr } from './candidatos-e-partidos-1.js';
import { Is } from './eventos-e-progresso-1.js';
import { createTimelineInteractions } from './indicador-timeline-interacoes.js';
import { renderTimeline } from './indicador-timeline-render.js';

export let s1, cc, zl;
function useLiveMinute(t) {
  const [e, n] = useState(() => Feed.minuteOf(Date.now()));
  return (
    useEffect(() => {
      if (!t) return;
      n(Feed.minuteOf(Date.now()));
      const s = setInterval(() => n(Feed.minuteOf(Date.now())), 1e3);
      return () => clearInterval(s);
    }, [t]),
    t ? e : null
  );
}
function formatMinute(t) {
  const e = ((Math.floor(t * 60) % 86400) + 86400) % 86400,
    n = (s) => String(s).padStart(2, '0');
  return (
    Math.floor(e / 3600) + ':' + n(Math.floor(e / 60) % 60) + ':' + n(e % 60)
  );
}
function Timeline({
  t,
  live: e,
  clock: n,
  onScrub: s,
  onLive: a,
  onForward: r = null,
  playing: u = !1,
  onPlay: i = null,
  fresh: c = null,
  count: l = !1,
}) {
  const d = useRef(null),
    $ = useRef(null),
    [f, m] = Ao(),
    [h, g] = useState(null),
    v = useMemo(
      () => (ot) => {
        ((d.current = ot), f(ot));
      },
      [],
    ),
    M = mr(),
    S = useRef(1),
    cursor = useRef(t),
    x = s1(e && Feed.LIVE),
    w = x != null && x - n < 360 ? x : null,
    z = w != null ? Math.max(n, w) : n,
    gt = w != null ? z : t,
    _ = z > je ? Math.ceil((z + 1) / 60) * 60 : je,
    j = Math.floor(_ / 60),
    Y = (ot) => ((ie(ot, Oe, _) - Oe) / (_ - Oe)) * 100;
  cursor.current = gt;
  const { T, xt, Bt, ve, Ke } = createTimelineInteractions({
    cursor,
    d,
    $,
    _,
    r,
    n,
    a,
    s,
    g,
    z,
    t,
  });
  const we = Array.from(
      {
        length: j - 17 + 1,
      },
      (ot, ke) => 17 + ke,
    ),
    Ae = we.length > 8 ? 2 : 1,
    D = m.w,
    q = S.current;
  S.current = D
    ? D < (q === 3 ? 284 : 236)
      ? 3
      : D < (q === 1 ? 396 : 444)
        ? 2
        : 1
    : 1;
  const le = S.current * Ae,
    be = Is.filter((ot) => ot.big && ot.t <= n);
  return renderTimeline({
    i,
    u,
    w,
    cc,
    t,
    v,
    xt,
    Bt,
    ve,
    g,
    Ke,
    T,
    _,
    z,
    gt,
    e,
    Y,
    be,
    c,
    s,
    h,
    we,
    le,
    l,
    M,
    a,
  });
}

export function initialize() {
  s1 = useLiveMinute;
  cc = formatMinute;
  zl = Timeline;
}
