/** Malha IBGE 2025 derivada para apresentação. Procedência em provenance.json. */
import arcos01 from './geography/arcs/arcos01.json' with { type: 'json' };
import arcos02 from './geography/arcs/arcos02.json' with { type: 'json' };
import arcos03 from './geography/arcs/arcos03.json' with { type: 'json' };
import arcos04 from './geography/arcs/arcos04.json' with { type: 'json' };
import arcos05 from './geography/arcs/arcos05.json' with { type: 'json' };
import arcos06 from './geography/arcs/arcos06.json' with { type: 'json' };
import arcos07 from './geography/arcs/arcos07.json' with { type: 'json' };
import arcos08 from './geography/arcs/arcos08.json' with { type: 'json' };
import arcos09 from './geography/arcs/arcos09.json' with { type: 'json' };
import arcos10 from './geography/arcs/arcos10.json' with { type: 'json' };
import arcos11 from './geography/arcs/arcos11.json' with { type: 'json' };
import arcos12 from './geography/arcs/arcos12.json' with { type: 'json' };
import arcos13 from './geography/arcs/arcos13.json' with { type: 'json' };
import arcos14 from './geography/arcs/arcos14.json' with { type: 'json' };
import arcos15 from './geography/arcs/arcos15.json' with { type: 'json' };
import arcos16 from './geography/arcs/arcos16.json' with { type: 'json' };
import arcos17 from './geography/arcs/arcos17.json' with { type: 'json' };
import arcos18 from './geography/arcs/arcos18.json' with { type: 'json' };
import arcos19 from './geography/arcs/arcos19.json' with { type: 'json' };
import arcos20 from './geography/arcs/arcos20.json' with { type: 'json' };
import arcos21 from './geography/arcs/arcos21.json' with { type: 'json' };
import arcos22 from './geography/arcs/arcos22.json' with { type: 'json' };
import arcos23 from './geography/arcs/arcos23.json' with { type: 'json' };
import arcos24 from './geography/arcs/arcos24.json' with { type: 'json' };
import arcos25 from './geography/arcs/arcos25.json' with { type: 'json' };
import arcos26 from './geography/arcs/arcos26.json' with { type: 'json' };
import arcos27 from './geography/arcs/arcos27.json' with { type: 'json' };
import arcos28 from './geography/arcs/arcos28.json' with { type: 'json' };
import arcos29 from './geography/arcs/arcos29.json' with { type: 'json' };
import arcos30 from './geography/arcs/arcos30.json' with { type: 'json' };
import arcos31 from './geography/arcs/arcos31.json' with { type: 'json' };
import arcos32 from './geography/arcs/arcos32.json' with { type: 'json' };
import arcos33 from './geography/arcs/arcos33.json' with { type: 'json' };
import municipiosRO from './geography/municipalities/ro.json' with { type: 'json' };
import municipiosAC from './geography/municipalities/ac.json' with { type: 'json' };
import municipiosAM from './geography/municipalities/am.json' with { type: 'json' };
import municipiosRR from './geography/municipalities/rr.json' with { type: 'json' };
import municipiosPA from './geography/municipalities/pa.json' with { type: 'json' };
import municipiosAP from './geography/municipalities/ap.json' with { type: 'json' };
import municipiosTO from './geography/municipalities/to.json' with { type: 'json' };
import municipiosMA from './geography/municipalities/ma.json' with { type: 'json' };
import municipiosPI from './geography/municipalities/pi.json' with { type: 'json' };
import municipiosCE from './geography/municipalities/ce.json' with { type: 'json' };
import municipiosRN from './geography/municipalities/rn.json' with { type: 'json' };
import municipiosPB from './geography/municipalities/pb.json' with { type: 'json' };
import municipiosPE from './geography/municipalities/pe.json' with { type: 'json' };
import municipiosAL from './geography/municipalities/al.json' with { type: 'json' };
import municipiosSE from './geography/municipalities/se.json' with { type: 'json' };
import municipiosBA from './geography/municipalities/ba.json' with { type: 'json' };
import municipiosMG from './geography/municipalities/mg.json' with { type: 'json' };
import municipiosES from './geography/municipalities/es.json' with { type: 'json' };
import municipiosRJ from './geography/municipalities/rj.json' with { type: 'json' };
import municipiosSP from './geography/municipalities/sp.json' with { type: 'json' };
import municipiosPR from './geography/municipalities/pr.json' with { type: 'json' };
import municipiosSC from './geography/municipalities/sc.json' with { type: 'json' };
import municipiosRS from './geography/municipalities/rs.json' with { type: 'json' };
import municipiosMS from './geography/municipalities/ms.json' with { type: 'json' };
import municipiosMT from './geography/municipalities/mt.json' with { type: 'json' };
import municipiosGO from './geography/municipalities/go.json' with { type: 'json' };
import municipiosDF from './geography/municipalities/df.json' with { type: 'json' };
import brasil from './geography/brasil.json' with { type: 'json' };
import municipios from './geography/municipios.json' with { type: 'json' };
import mundo from '../generated/geography/mundo.json' with { type: 'json' };

window.BRASIL = {
  ...brasil,
  arcs: [
    ...arcos01,
    ...arcos02,
    ...arcos03,
    ...arcos04,
    ...arcos05,
    ...arcos06,
    ...arcos07,
    ...arcos08,
    ...arcos09,
    ...arcos10,
    ...arcos11,
    ...arcos12,
    ...arcos13,
    ...arcos14,
    ...arcos15,
    ...arcos16,
    ...arcos17,
    ...arcos18,
    ...arcos19,
    ...arcos20,
    ...arcos21,
    ...arcos22,
    ...arcos23,
    ...arcos24,
    ...arcos25,
    ...arcos26,
    ...arcos27,
    ...arcos28,
    ...arcos29,
    ...arcos30,
    ...arcos31,
    ...arcos32,
    ...arcos33,
  ],
  objects: {
    municipios: {
      ...municipios,
      geometries: [
        ...municipiosRO,
        ...municipiosAC,
        ...municipiosAM,
        ...municipiosRR,
        ...municipiosPA,
        ...municipiosAP,
        ...municipiosTO,
        ...municipiosMA,
        ...municipiosPI,
        ...municipiosCE,
        ...municipiosRN,
        ...municipiosPB,
        ...municipiosPE,
        ...municipiosAL,
        ...municipiosSE,
        ...municipiosBA,
        ...municipiosMG,
        ...municipiosES,
        ...municipiosRJ,
        ...municipiosSP,
        ...municipiosPR,
        ...municipiosSC,
        ...municipiosRS,
        ...municipiosMS,
        ...municipiosMT,
        ...municipiosGO,
        ...municipiosDF,
      ],
    },
  },
};
window.MUNDO = mundo;
