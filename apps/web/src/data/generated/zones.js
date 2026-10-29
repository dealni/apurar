/** Dados públicos preservados. Os JSONs são editáveis; imports estáticos mantêm a inicialização síncrona. */
import metadados from './zones/metadados.json' with { type: 'json' };
import zonasRO from './zones/ro.json' with { type: 'json' };
import zonasAC from './zones/ac.json' with { type: 'json' };
import zonasAM from './zones/am.json' with { type: 'json' };
import zonasRR from './zones/rr.json' with { type: 'json' };
import zonasPA from './zones/pa.json' with { type: 'json' };
import zonasAP from './zones/ap.json' with { type: 'json' };
import zonasTO from './zones/to.json' with { type: 'json' };
import zonasMA from './zones/ma.json' with { type: 'json' };
import zonasPI from './zones/pi.json' with { type: 'json' };
import zonasCE from './zones/ce.json' with { type: 'json' };
import zonasRN from './zones/rn.json' with { type: 'json' };
import zonasPB from './zones/pb.json' with { type: 'json' };
import zonasPE from './zones/pe.json' with { type: 'json' };
import zonasAL from './zones/al.json' with { type: 'json' };
import zonasSE from './zones/se.json' with { type: 'json' };
import zonasBA from './zones/ba.json' with { type: 'json' };
import zonasMG from './zones/mg.json' with { type: 'json' };
import zonasES from './zones/es.json' with { type: 'json' };
import zonasRJ from './zones/rj.json' with { type: 'json' };
import zonasSP from './zones/sp.json' with { type: 'json' };
import zonasPR from './zones/pr.json' with { type: 'json' };
import zonasSC from './zones/sc.json' with { type: 'json' };
import zonasRS from './zones/rs.json' with { type: 'json' };
import zonasMS from './zones/ms.json' with { type: 'json' };
import zonasMT from './zones/mt.json' with { type: 'json' };
import zonasGO from './zones/go.json' with { type: 'json' };
import zonasDF from './zones/df.json' with { type: 'json' };

window.ZONAS = {
  ...metadados,
  m: {
    ...zonasRO,
    ...zonasAC,
    ...zonasAM,
    ...zonasRR,
    ...zonasPA,
    ...zonasAP,
    ...zonasTO,
    ...zonasMA,
    ...zonasPI,
    ...zonasCE,
    ...zonasRN,
    ...zonasPB,
    ...zonasPE,
    ...zonasAL,
    ...zonasSE,
    ...zonasBA,
    ...zonasMG,
    ...zonasES,
    ...zonasRJ,
    ...zonasSP,
    ...zonasPR,
    ...zonasSC,
    ...zonasRS,
    ...zonasMS,
    ...zonasMT,
    ...zonasGO,
    ...zonasDF,
  },
};
window.dispatchEvent(new Event('zonas'));
