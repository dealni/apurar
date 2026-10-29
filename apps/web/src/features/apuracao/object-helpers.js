var Kd = Object.defineProperty,
  Xd = Object.defineProperties;
var Yd = Object.getOwnPropertyDescriptors;
var ir = Object.getOwnPropertySymbols;
var lu = Object.prototype.hasOwnProperty,
  ru = Object.prototype.propertyIsEnumerable;
var au = (Ot, Kt, P) =>
    Kt in Ot
      ? Kd(Ot, Kt, {
          enumerable: !0,
          configurable: !0,
          writable: !0,
          value: P,
        })
      : (Ot[Kt] = P),
  Fe = (Ot, Kt) => {
    for (var P in Kt || (Kt = {})) lu.call(Kt, P) && au(Ot, P, Kt[P]);
    if (ir) for (const P of ir(Kt)) ru.call(Kt, P) && au(Ot, P, Kt[P]);
    return Ot;
  },
  We = (Ot, Kt) => Xd(Ot, Yd(Kt));
var ei = (Ot, Kt) => {
  var P = {};
  for (var ut in Ot) lu.call(Ot, ut) && Kt.indexOf(ut) < 0 && (P[ut] = Ot[ut]);
  if (Ot != null && ir)
    for (const ut of ir(Ot))
      Kt.indexOf(ut) < 0 && ru.call(Ot, ut) && (P[ut] = Ot[ut]);
  return P;
};
export { Kd, Xd, Yd, ir, lu, ru, au, Fe, We, ei };
