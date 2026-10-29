import { hasOpenModal } from "../../../runtime/interaction-guards.ts";
import { renderSeletor } from "./modelo-mapa-legenda-seletor.js";
import {
  useState,
  useRef,
  lt,
  ts,
  useEffect,
  useLayoutEffect,
  html,
} from "./formatacao-e-acessibilidade-1.js";
import { ss } from "./apuracao-e-votos-1.js";
import { lc, ya, oc } from "./mapa-dicas-e-legenda-1.js";
import { So } from "./hud-e-comunicacao-1.js";
export let rc, n1;
export function initialize() {
  rc = ({
    list: t,
    level: e,
    setLevel: n,
    m: s,
    cand: a,
    setCand: r,
    replay: u = !1,
    room: i = null,
  }) => {
    const [c, l] = useState(null),
      d = useRef(null),
      $ = a != null ? lt[a] : null,
      f = () => {
        const w = d.current && d.current.querySelector(".cb");
        w &&
          ts.on &&
          w.focus({
            preventScroll: !0,
          });
      };
    (useEffect(() => {
      if (!c) return;
      const w = (gt) => {
          d.current && !d.current.contains(gt.target) && l(null);
        },
        z = (gt) => {
          !gt.defaultPrevented &&
            !hasOpenModal() &&
            gt.key === "Escape" &&
            (gt.stopPropagation(), l(null), f());
        };
      return (
        addEventListener("mousedown", w),
        addEventListener("keydown", z, !0),
        () => {
          (removeEventListener("mousedown", w),
            removeEventListener("keydown", z, !0));
        }
      );
    }, [c]),
      useEffect(() => {
        (u || (c === "cand" && e !== "cand")) && l(null);
      }, [u, e]),
      useLayoutEffect(() => {
        const menu = c && d.current?.querySelector(".candpick");
        if (!menu) return;
        const selected = menu.querySelector(
          '[aria-selected="true"], [aria-checked="true"]:not(:disabled)',
        );
        if (ts.on)
          (selected || menu.querySelector("button:not(:disabled)"))?.focus({
            preventScroll: true,
          });
        selected?.scrollIntoView({ block: "nearest" });
      }, [c]));
    const m = (w) =>
        e === w || (w === "mun" && e === "uf" && !t.some((z) => z[0] === "uf")),
      h = (s.n.base ?? s.n.valid) > 0 ? s.pres : s.pres.slice().sort(ss),
      g = t.filter((w) => lc.has(w[0])),
      v = t
        .filter((w) => !lc.has(w[0]))
        .sort(
          (w, z) => (ya[w[0]] ? ya[w[0]][0] : 9) - (ya[z[0]] ? ya[z[0]][0] : 9),
        ),
      M = v.find((w) => w[0] === e),
      S = (w) => u && oc.has(w),
      x = (w) => {
        w === "cand" ? (n("cand"), l("cand")) : (l(null), n(w), f());
      };
    return renderSeletor({
      level: e,
      setLevel: n,
      model: s,
      cand: a,
      setCand: r,
      room: i,
      openMenu: c,
      setOpenMenu: l,
      containerRef: d,
      selectedCandidate: $,
      restoreFocus: f,
      isSelected: m,
      candidates: h,
      primaryLevels: g,
      extraLevels: v,
      selectedLevel: M,
      isDisabled: S,
      selectLevel: x,
    });
  };
  n1 = ({ onClick: t, on: e = !1 }) =>
    html`<button
      class=${"expill" + (e ? " on" : "")}
      aria-pressed=${e}
      onClick=${t}
      aria-label=${e ? "Voltar ao Brasil" : "Ver os votos do exterior"}
    >
      <${So} size=${13} /><span>Exterior</span>
    </button>`;
}
