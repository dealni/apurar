import { Geo } from '../geography.js';
const DEGREES_TO_RADIANS = Math.PI / 180,
  tileToLonLat = (H, pt, me) => {
    const V = 2 ** H;
    return [
      (pt / V) * 360 - 180,
      Math.atan(Math.sinh(Math.PI * (1 - (2 * me) / V))) / DEGREES_TO_RADIANS,
    ];
  },
  lonLatToTile = (H, pt, me) => {
    const V = 2 ** H,
      et = Math.sin(Math.max(-85, Math.min(85, me)) * DEGREES_TO_RADIANS);
    return [
      Math.floor(((pt + 180) / 360) * V),
      Math.floor((0.5 - Math.log((1 + et) / (1 - et)) / (4 * Math.PI)) * V),
    ];
  },
  tileToMap = (H, pt, me) => {
    const V = tileToLonLat(H, pt, me);
    return Geo.fromLL(V[0], V[1]);
  },
  tileTransform = (H, pt, me, V) => {
    const et = tileToMap(H, pt + 0.5, me + 0.5),
      ct = tileToMap(H, pt + 1, me + 0.5),
      X = tileToMap(H, pt, me + 0.5),
      mt = tileToMap(H, pt + 0.5, me + 1),
      J = tileToMap(H, pt + 0.5, me),
      At = (ct[0] - X[0]) / V,
      Yt = (ct[1] - X[1]) / V,
      rt = (mt[0] - J[0]) / V,
      nt = (mt[1] - J[1]) / V;
    return [
      et[0] - ((At + rt) * V) / 2,
      et[1] - ((Yt + nt) * V) / 2,
      At,
      Yt,
      rt,
      nt,
    ];
  },
  tileClipPath = (H, pt, me) => {
    const V = new Path2D(),
      et = [
        tileToMap(H, pt, me),
        tileToMap(H, pt + 1, me),
        tileToMap(H, pt + 1, me + 1),
        tileToMap(H, pt, me + 1),
      ];
    V.moveTo(et[0][0], et[0][1]);
    for (let ct = 1; ct < 4; ct++) V.lineTo(et[ct][0], et[ct][1]);
    return (V.closePath(), V);
  };
export {
  DEGREES_TO_RADIANS,
  tileToLonLat,
  lonLatToTile,
  tileToMap,
  tileTransform,
  tileClipPath,
};
