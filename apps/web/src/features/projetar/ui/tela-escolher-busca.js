import { lt } from "./formatacao-e-acessibilidade-1.js";
export function criarEscolhaDaBusca({ w, De, yn, $, Xe, vs, h, f }) {
  return (I) => {
    if ((w(!1), I.t === "uf")) De(yn, I.uf);
    else if (I.t === "town") De(yn, I.uf, I.i);
    else if (I.t === "zz") De("pres", "ZZ");
    else if (I.t === "country") De("pres", "ZZ", null, $, I.iso);
    else if (I.t === "city") De("pres", "ZZ", I.i);
    else if (I.t === "zone") De("pres", I.uf, I.i);
    else if (I.office === "pres") {
      const K = lt.findIndex((te) => te.id === I.c.id);
      (vs({
        office: "pres",
        uf: null,
        id: I.c.id,
        at: "pres",
      }),
        K >= 0
          ? (h(K), f("cand"), De("pres", null, null, "cand", null, K))
          : De("pres", null));
    } else
      (vs({
        office: I.office,
        uf: I.uf,
        id: I.c.id,
        at: I.office + I.uf,
      }),
        De(I.office, I.uf));
  };
}
