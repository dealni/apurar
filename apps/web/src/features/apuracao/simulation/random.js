import { Geo } from '../geography.js';
/*
 * Simulação determinística: random.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createRandomEngine() {
  const createRandom = (y) => () => {
    ((y |= 0), (y = (y + 1831565813) | 0));
    let Z = Math.imul(y ^ (y >>> 15), 1 | y);
    return (
      (Z = (Z + Math.imul(Z ^ (Z >>> 7), 61 | Z)) ^ Z),
      ((Z ^ (Z >>> 14)) >>> 0) / 4294967296
    );
  };
  const normalRandom = (y) => {
    let Z = 0,
      G = 0;
    for (; !Z;) Z = y();
    for (; !G;) G = y();
    return Math.sqrt(-2 * Math.log(Z)) * Math.cos(2 * Math.PI * G);
  };
  const seededFraction = (y, Z) => createRandom(y * 7919 + Z * 104729 + 17)();
  const spatialNoise = (() => {
    const Z = Math.max(Geo.W, Geo.H) / 63,
      G = createRandom(77),
      it = Array.from(
        {
          length: 4096,
        },
        () => normalRandom(G),
      ),
      vt = (It, U) => it[(U % 64) * 64 + (It % 64)],
      St = (It) => It * It * (3 - 2 * It);
    return (It, U, Et = 1) => {
      const Lt = (It / Z) * Et,
        wt = (U / Z) * Et,
        qe = Math.floor(Lt),
        ee = Math.floor(wt),
        Le = St(Lt - qe),
        mn = St(wt - ee),
        Vn = vt(qe, ee),
        $s = vt(qe + 1, ee),
        xn = vt(qe, ee + 1),
        ns = vt(qe + 1, ee + 1);
      return (
        Vn + ($s - Vn) * Le + (xn - Vn) * mn + (Vn - $s - xn + ns) * Le * mn
      );
    };
  })();
  const parseClock = (y) => {
    const [Z, G] = y.split(':').map(Number);
    return Z * 60 + G;
  };
  return {
    createRandom,
    normalRandom,
    parseClock,
    seededFraction,
    spatialNoise,
  };
}
